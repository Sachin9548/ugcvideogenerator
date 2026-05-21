"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const common_1 = require("@nestjs/common");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const prisma_service_1 = require("../prisma/prisma.service");
const jwt = __importStar(require("jsonwebtoken"));
const genai_1 = require("@google/genai");
let VideoService = class VideoService {
    prisma;
    groq;
    gemini;
    constructor(prisma) {
        this.prisma = prisma;
        this.groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
        this.gemini = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
    }
    getKlingToken() {
        return jwt.sign({
            iss: process.env.KLING_ACCESS_KEY || '',
            exp: Math.floor(Date.now() / 1000) + 1800,
            nbf: Math.floor(Date.now() / 1000) - 5,
        }, process.env.KLING_SECRET_KEY || '', { algorithm: 'HS256' });
    }
    async generateCinematicPrompt(topic) {
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
    async createCinematicVideo(userId, topic, quality, duration) {
        try {
            const cinematicPrompt = await this.generateCinematicPrompt(topic);
            let klingMode = 'pro';
            if (quality === 'Studio-Cinematic-Fast')
                klingMode = 'std';
            if (quality === 'Studio-Cinematic-Ultra 4K')
                klingMode = '4k';
            console.log(`🎬 Calling Kling API (Text2Video) -> Mode: ${klingMode}, Duration: ${duration}s`);
            const body = {
                model_name: 'kling-v3',
                mode: klingMode,
                aspect_ratio: '16:9',
                duration: duration,
                prompt: cinematicPrompt,
            };
            const createRes = await fetch('https://api.klingai.com/v1/videos/text2video', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.getKlingToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const createData = await createRes.json();
            if (createData.code !== 0)
                throw new Error(JSON.stringify(createData));
            const taskId = createData.data.task_id;
            let finalVideoUrl = '';
            for (let i = 0; i < 80; i++) {
                await new Promise((r) => setTimeout(r, 5000));
                const pollRes = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
                    headers: { Authorization: `Bearer ${this.getKlingToken()}` },
                });
                const pollData = await pollRes.json();
                const status = pollData.data?.task_status;
                console.log(`[Cinematic Poll] Status: ${status} | ${Math.round((pollData.data?.task_progress || 0) * 100)}%`);
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
        }
        catch (error) {
            console.error('❌ Cinematic Error:', error);
            throw new Error('Failed to generate Cinematic video');
        }
    }
    async combineImagesWithGemini(characterBase64, productBase64) {
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
        const imagePart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
            throw new Error('Gemini failed to generate image or returned undefined data.');
        }
        return imagePart.inlineData.data;
    }
    async generateUGCStoryboards(topic, duration) {
        console.log(`🧠 Groq is writing UGC Storyboard for: ${topic} (${duration}s)`);
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
        if (!content)
            throw new Error('Groq returned empty response.');
        try {
            const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
            return JSON.parse(jsonStr);
        }
        catch {
            throw new Error('AI failed to generate a valid script.');
        }
    }
    async createUGCVideo(userId, topic, charBase64, prodBase64, quality, duration) {
        try {
            const combinedBase64 = await this.combineImagesWithGemini(charBase64, prodBase64);
            const storyboards = await this.generateUGCStoryboards(topic, duration);
            let klingMode = quality.includes('Pro') ? 'pro' : 'std';
            console.log(`🎬 Calling Kling API (Omni V3) -> Mode: ${klingMode}, Duration: ${duration}s`);
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
            const createRes = await fetch('https://api.klingai.com/v1/videos/omni-video', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.getKlingToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const createData = await createRes.json();
            if (createData.code !== 0)
                throw new Error(JSON.stringify(createData));
            const taskId = createData.data.task_id;
            let finalVideoUrl = '';
            for (let i = 0; i < 80; i++) {
                await new Promise((r) => setTimeout(r, 5000));
                const pollRes = await fetch(`https://api.klingai.com/v1/videos/omni-video/${taskId}`, {
                    headers: { Authorization: `Bearer ${this.getKlingToken()}` },
                });
                const pollData = await pollRes.json();
                const status = pollData.data?.task_status;
                console.log(`[UGC Poll] Status: ${status} | ${Math.round((pollData.data?.task_progress || 0) * 100)}%`);
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
        }
        catch (error) {
            console.error('❌ UGC Error:', error);
            throw new common_1.InternalServerErrorException(error.message || 'Failed to generate UGC video');
        }
    }
};
exports.VideoService = VideoService;
exports.VideoService = VideoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VideoService);
//# sourceMappingURL=video.service.js.map