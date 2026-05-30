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
const storage_service_1 = require("../storage/storage.service");
let VideoService = class VideoService {
    prisma;
    storageService;
    groq;
    gemini;
    KLING_BASE_URL = 'https://api-singapore.klingai.com/v1/videos';
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
        this.gemini = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
    }
    cleanBase64(base64) {
        return base64.replace(/^data:image\/\w+;base64,/, '');
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
    async createUGCVideo(userId, topic, charBase64, prodBase64, quality, duration, engine = 'omni') {
        try {
            const combinedBase64 = await this.combineImagesWithGemini(charBase64, prodBase64);
            const generatedImageFile = {
                buffer: Buffer.from(combinedBase64, 'base64'),
                originalname: 'generated-image.png',
                mimetype: 'image/png',
            };
            const generatedImageUrl = await this.storageService.uploadFile(generatedImageFile, 'generated-images');
            console.log('✅ Generated image saved:', generatedImageUrl);
            const storyboards = await this.generateUGCStoryboards(topic, duration);
            let klingMode = quality.includes('Pro') ? 'pro' : 'std';
            console.log(`🎬 Calling Kling API -> Engine: ${engine}, Mode: ${klingMode}, Duration: ${duration}s`);
            let endpointUrl = '';
            let body = {};
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
            }
            else {
                endpointUrl = 'https://api.klingai.com/v1/videos/image2video';
                body = {
                    model_name: 'kling-v3',
                    mode: klingMode,
                    aspect_ratio: '9:16',
                    duration: duration,
                    sound: 'on',
                    seed: 1066399786,
                    image: combinedBase64,
                    prompt: 'Authentic jewelry UGC Instagram reel, real woman reviewing ring, natural home lighting, handheld iPhone camera, genuine emotions, stable medium shot, no extreme zoom, no morphing',
                    negative_prompt: 'extreme close up, 360 rotation, studio lighting, fake sparkle effects, AI look, smooth camera, watermark, morphing',
                    multi_shot: true,
                    shot_type: 'customize',
                    multi_prompt: storyboards,
                };
            }
            const createRes = await fetch(endpointUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.getKlingToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const createData = await createRes.json();
            if (createData.code !== 0)
                throw new Error(JSON.stringify(createData));
            const taskId = createData.data.task_id;
            let finalVideoUrl = '';
            for (let i = 0; i < 80; i++) {
                await new Promise((r) => setTimeout(r, 5000));
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
                if (status === 'failed')
                    throw new Error(`Kling UGC Generation failed in ${engine} mode.`);
            }
            let existingUser = await this.prisma.user.findUnique({ where: { clerkId: userId } });
            if (!existingUser) {
                existingUser = await this.prisma.user.create({
                    data: { clerkId: userId, email: `${userId}@fallback.com`, credits: 0 },
                });
            }
            return await this.prisma.video.create({
                data: {
                    prompt: topic,
                    style: `UGC (${engine})`,
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], VideoService);
//# sourceMappingURL=video.service.js.map