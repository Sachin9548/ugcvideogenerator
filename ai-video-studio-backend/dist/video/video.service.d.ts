import { PrismaService } from '../prisma/prisma.service';
export declare class VideoService {
    private prisma;
    private groq;
    private gemini;
    constructor(prisma: PrismaService);
    private getKlingToken;
    private generateCinematicPrompt;
    createCinematicVideo(userId: string, topic: string, quality: string, duration: string): Promise<{
        id: string;
        prompt: string;
        style: string;
        status: string;
        videoUrl: string | null;
        createdAt: Date;
        userId: string;
    }>;
    private combineImagesWithGemini;
    private generateUGCStoryboards;
    createUGCVideo(userId: string, topic: string, charBase64: string, prodBase64: string, quality: string, duration: string): Promise<{
        id: string;
        prompt: string;
        style: string;
        status: string;
        videoUrl: string | null;
        createdAt: Date;
        userId: string;
    }>;
}
