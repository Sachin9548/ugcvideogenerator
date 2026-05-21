import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class VideoService {
  private groq: Groq;
  private gemini: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
  }

  private getKlingToken() {
    return jwt.sign(
      {
        iss: process.env.KLING_ACCESS_KEY || '',
        exp: Math.floor(Date.now() / 1000) + 1800,
        nbf: Math.floor(Date.now() / 1000) - 5,
      },
      process.env.KLING_SECRET_KEY || '',
      { algorithm: 'HS256' },
    );
  }

  // ==========================================
  // TYPE 1: CINEMATIC VIDEO ENGINE (Real Kling API)
  // ==========================================
  private async generateCinematicPrompt(topic: string) {
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Write a highly detailed cinematic prompt for a video generator about: ${topic}. Max 500 characters.`,
        },
      ],
    });
    return response.choices[0]?.message?.content || topic;
  }

  async createCinematicVideo(
    userId: string,
    topic: string,
    quality: string,
    duration: string,
  ) {
    try {
      const cinematicPrompt = await this.generateCinematicPrompt(topic);

      let klingMode = 'pro';
      if (quality === 'Studio-Cinematic-Fast') klingMode = 'std';
      if (quality === 'Studio-Cinematic-Ultra 4K') klingMode = '4k';

      console.log(
        `🎬 Calling Kling API (Text2Video) -> Mode: ${klingMode}, Duration: ${duration}s`,
      );

      const body = {
        model_name: 'kling-v3',
        mode: klingMode,
        aspect_ratio: '16:9',
        duration: duration,
        prompt: cinematicPrompt,
      };

      const createRes = await fetch(
        'https://api.klingai.com/v1/videos/text2video',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.getKlingToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
      const createData = await createRes.json();
      if (createData.code !== 0) throw new Error(JSON.stringify(createData));

      const taskId = createData.data.task_id;
      let finalVideoUrl = '';

      // Polling Logic
      for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const pollRes = await fetch(
          `https://api.klingai.com/v1/videos/text2video/${taskId}`,
          {
            headers: { Authorization: `Bearer ${this.getKlingToken()}` },
          },
        );
        const pollData = await pollRes.json();
        const status = pollData.data?.task_status;
        console.log(
          `[Cinematic Poll] Status: ${status} | ${Math.round((pollData.data?.task_progress || 0) * 100)}%`,
        );

        if (status === 'succeed') {
          finalVideoUrl = pollData.data.task_result.videos[0].url;
          break;
        }
        if (status === 'failed')
          throw new Error('Kling failed to generate video.');
      }

      let existingUser = await this.prisma.user.findUnique({
        where: { clerkId: userId },
      });
      if (!existingUser) {
        existingUser = await this.prisma.user.create({
          data: {
            clerkId: userId,
            email: `${userId}@fallback.com`,
            credits: 0,
          },
        });
      }

      return await this.prisma.video.create({
        data: {
          prompt: cinematicPrompt,
          style: 'Cinematic',
          status: 'completed',
          videoUrl: finalVideoUrl,
          user: { connect: { clerkId: userId } },
        },
      });
    } catch (error) {
      console.error('❌ Cinematic Error:', error);
      throw new Error('Failed to generate Cinematic video');
    }
  }

  // ==========================================
  // TYPE 2: UGC VIDEO ENGINE
  // ==========================================
  private async combineImagesWithGemini(
    characterBase64: string,
    productBase64: string,
  ): Promise<string> {
    console.log('🎨 Calling Gemini API to combine images...');
    const systemPrompt = `You are an expert image-generation engine. You must ALWAYS produce an image as Character with product holding in hand.`;

    const response = await this.gemini.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Character with product` },
            { inlineData: { mimeType: 'image/jpeg', data: characterBase64 } },
            { inlineData: { mimeType: 'image/jpeg', data: productBase64 } },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '9:16', imageSize: '2K' },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData,
    );

    // 👇 TS Strict Mode Fix: Check if everything exists before returning
    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
      throw new Error(
        'Gemini failed to generate image or returned undefined data.',
      );
    }

    return imagePart.inlineData.data;
  }
  private async generateUGCStoryboards(topic: string, duration: string) {
    console.log(
      `🧠 Groq is writing UGC Storyboard for: ${topic} (${duration}s)`,
    );
    // AI ko clearly bata rahe hain ki duration split karni hai
    const systemPrompt = `You are a UGC Video Director. The user wants to sell: "${topic}". Total video duration is exactly ${duration} seconds.
    Create a multi-shot storyboard. The SUM of all "duration" fields MUST be exactly ${duration}.
    Output exactly in this JSON array format:
    [
      { "index": 1, "duration": 4, "prompt": "Scene description with dialogue..." },
      { "index": 2, "duration": ..., "prompt": "..." }
    ]`;

    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Groq returned empty response.');

    try {
      const jsonStr = content.substring(
        content.indexOf('['),
        content.lastIndexOf(']') + 1,
      );
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('AI failed to generate a valid script.');
    }
  }

  async createUGCVideo(
    userId: string,
    topic: string,
    charBase64: string,
    prodBase64: string,
    quality: string,
    duration: string,
  ) {
    try {
      const combinedBase64 = await this.combineImagesWithGemini(
        charBase64,
        prodBase64,
      );
      const storyboards = await this.generateUGCStoryboards(topic, duration);

      let klingMode = quality.includes('Pro') ? 'pro' : 'std';
      console.log(
        `🎬 Calling Kling API (Omni V3) -> Mode: ${klingMode}, Duration: ${duration}s`,
      );

      const body = {
        model_name: 'kling-v3-omni',
        mode: klingMode,
        aspect_ratio: '9:16',
        duration: duration,
        sound: 'on',
        seed: 1066399786,
        prompt: 'addictive hook ad',
        image_list: [{ image_url: combinedBase64 }],
        multi_shot: true,
        shot_type: 'customize',
        multi_prompt: storyboards,
      };

      const createRes = await fetch(
        'https://api.klingai.com/v1/videos/omni-video',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.getKlingToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const createData = await createRes.json();
      if (createData.code !== 0) throw new Error(JSON.stringify(createData));

      const taskId = createData.data.task_id;
      let finalVideoUrl = '';

      for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const pollRes = await fetch(
          `https://api.klingai.com/v1/videos/omni-video/${taskId}`,
          {
            headers: { Authorization: `Bearer ${this.getKlingToken()}` },
          },
        );
        const pollData = await pollRes.json();
        const status = pollData.data?.task_status;
        console.log(
          `[UGC Poll] Status: ${status} | ${Math.round((pollData.data?.task_progress || 0) * 100)}%`,
        );

        if (status === 'succeed') {
          finalVideoUrl = pollData.data.task_result.videos[0].url;
          break;
        }
        if (status === 'failed')
          throw new Error('Kling UGC Generation failed.');
      }

      let existingUser = await this.prisma.user.findUnique({
        where: { clerkId: userId },
      });
      if (!existingUser) {
        existingUser = await this.prisma.user.create({
          data: {
            clerkId: userId,
            email: `${userId}@fallback.com`,
            credits: 0,
          },
        });
      }

      return await this.prisma.video.create({
        data: {
          prompt: topic,
          style: 'UGC',
          status: 'completed',
          videoUrl: finalVideoUrl,
          user: { connect: { clerkId: userId } },
        },
      });
    } catch (error: any) {
      console.error('❌ UGC Error:', error);
      throw new InternalServerErrorException(
        error.message || 'Failed to generate UGC video',
      );
    }
  }
}
