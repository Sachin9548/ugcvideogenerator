import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class VideoService {
  private groq: Groq;
  private gemini: GoogleGenAI;
  private readonly KLING_BASE_URL = 'https://api-singapore.klingai.com/v1/videos';
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
  }

  private cleanBase64(base64: string): string {
    return base64.replace(/^data:image\/\w+;base64,/, '');
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

  private async combineImagesWithGemini(
    characterBase64: string,
    productBase64: string,
  ): Promise<string> {
    console.log('🎨 Calling Gemini API to combine images...');

    const systemPrompt = `You are a world-class high-end jewelry and UGC photographer. 
    Your task is to seamlessly blend the provided 'Character' and 'Product' (Ring) images.
    
    CRITICAL RULES:
    1. The product MUST retain its EXACT shape, color, diamond cut, and original design. DO NOT distort or change the ring.
    2. Place the ring naturally on the woman's ring finger or let her hold her hand up near her face.
    3. Keep the woman's face EXACTLY as it is in the original character photo.
    4. Make the lighting focus beautifully on the product to make it pop and sparkle.
    5. The final image must look like a real, casual iPhone 15 Pro selfie photo, not an AI generation.`;

    const response = await this.gemini.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Character with product` },
            { inlineData: { mimeType: 'image/jpeg', data: this.cleanBase64(characterBase64) } },
            { inlineData: { mimeType: 'image/jpeg', data: this.cleanBase64(productBase64) } },
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

    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
      throw new Error('Gemini failed to generate image or returned undefined data.');
    }

    return imagePart.inlineData.data;
  }


  private async generateUGCStoryboards(topic: string, duration: string) {
    console.log(
      `🧠 Groq is writing UGC Storyboard for: ${topic} (${duration}s)`,
    );

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
    engine: 'omni' | 'standard' = 'omni'
  ) {
    try {
      // 1. Gemini Image Generation & S3 Save
      const combinedBase64 = await this.combineImagesWithGemini(charBase64, prodBase64);
      const generatedImageFile = {
        buffer: Buffer.from(combinedBase64, 'base64'),
        originalname: 'generated-image.png',
        mimetype: 'image/png',
      };
      const generatedImageUrl = await this.storageService.uploadFile(generatedImageFile, 'generated-images');
      console.log('✅ Generated image saved:', generatedImageUrl);

      // 2. Groq Storyboards
      const storyboards = await this.generateUGCStoryboards(topic, duration);

      let klingMode = quality.includes('Pro') ? 'pro' : 'std';
      console.log(`🎬 Calling Kling API -> Engine: ${engine}, Mode: ${klingMode}, Duration: ${duration}s`);

      // 👇 DYNAMIC PAYLOAD & ENDPOINT BASED ON ENGINE
      let endpointUrl = '';
      let body: any = {};

      if (engine === 'omni') {
        endpointUrl = 'https://api.klingai.com/v1/videos/omni-video';
        body = {
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
      } else {
        // STANDARD MODE (Image2Video - Safe Pattern)
        endpointUrl = 'https://api.klingai.com/v1/videos/image2video';
        body = {
          model_name: 'kling-v3', // User script matched v3
          mode: klingMode,
          aspect_ratio: '9:16',
          duration: duration,
          sound: 'on',
          seed: 1066399786,
          image: combinedBase64, // Image2video uses 'image' string, not array
          prompt: 'Authentic jewelry UGC Instagram reel, real woman reviewing ring, natural home lighting, handheld iPhone camera, genuine emotions, stable medium shot, no extreme zoom, no morphing',
          negative_prompt: 'extreme close up, 360 rotation, studio lighting, fake sparkle effects, AI look, smooth camera, watermark, morphing',
          multi_shot: true,
          shot_type: 'customize',
          multi_prompt: storyboards,
        };
      }

      // 3. Create Task
      const createRes = await fetch(endpointUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.getKlingToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const createData = await createRes.json();
      if (createData.code !== 0) throw new Error(JSON.stringify(createData));

      const taskId = createData.data.task_id;
      let finalVideoUrl = '';

      // 4. Polling Loop
      for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 5000));

        // Polling URL bhi engine par depend karegi
        const pollUrl = engine === 'omni'
          ? `https://api.klingai.com/v1/videos/omni-video/${taskId}`
          : `https://api.klingai.com/v1/videos/image2video/${taskId}`;

        const pollRes = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${this.getKlingToken()}` },
        });
        const pollData = await pollRes.json();
        const status = pollData.data?.task_status;
        console.log(`[UGC Poll] Status: ${status} | ${Math.round((pollData.data?.task_progress || 0) * 100)}%`);

        if (status === 'succeed') {
          const klingVideoUrl = pollData.data.task_result.videos[0].url;

          // Download and S3 Upload
          const response = await fetch(klingVideoUrl);
          const arrayBuffer = await response.arrayBuffer();
          const generatedVideoFile = {
            buffer: Buffer.from(arrayBuffer),
            originalname: 'generated-video.mp4',
            mimetype: 'video/mp4',
          };
          finalVideoUrl = await this.storageService.uploadFile(generatedVideoFile, 'generated-videos');
          console.log('✅ Generated video saved to S3:', finalVideoUrl);
          break;
        }
        if (status === 'failed') throw new Error(`Kling UGC Generation failed in ${engine} mode.`);
      }

      // 5. Save to DB
      let existingUser = await this.prisma.user.findUnique({ where: { clerkId: userId } });
      if (!existingUser) {
        existingUser = await this.prisma.user.create({
          data: { clerkId: userId, email: `${userId}@fallback.com`, credits: 0 },
        });
      }

      return await this.prisma.video.create({
        data: {
          prompt: topic,
          style: `UGC (${engine})`, // UI me dikhega kaunsa model use hua
          status: 'completed',
          videoUrl: finalVideoUrl,
          user: { connect: { clerkId: userId } },
        },
      });
    } catch (error: any) {
      console.error('❌ UGC Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to generate UGC video');
    }
  }
}
