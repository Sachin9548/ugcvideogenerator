import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
export declare class VideoService {
    private prisma;
    private storageService;
    private groq;
    private gemini;
    private readonly KLING_BASE_URL;
    constructor(prisma: PrismaService, storageService: StorageService);
    private cleanBase64;
    private getKlingToken;
    private generateCinematicPrompt;
    createCinematicVideo(userId: string, topic: string, quality: string, duration: string): Promise<{
        id: string;
        createdAt: Date;
        prompt: string;
        style: string;
        status: string;
        videoUrl: string | null;
        userId: string;
    }>;
    private combineImagesWithGemini;
    private generateUGCStoryboards;
    createUGCVideo(userId: string, topic: string, charBase64: string, prodBase64: string, quality: string, duration: string, engine?: 'omni' | 'standard'): Promise<{
        id: string;
        createdAt: Date;
        prompt: string;
        style: string;
        status: string;
        videoUrl: string | null;
        userId: string;
    }>;
}
