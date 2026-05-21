import { VideoService } from './video.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class VideoController {
    private readonly videoService;
    private readonly storageService;
    private readonly prisma;
    constructor(videoService: VideoService, storageService: StorageService, prisma: PrismaService);
    getUserData(userId: string): Promise<{
        success: boolean;
        credits: number;
    }>;
    getUserGallery(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            prompt: string;
            style: string;
            status: string;
            videoUrl: string | null;
            createdAt: Date;
            userId: string;
        }[];
    }>;
    generateVideo(body: {
        userId: string;
        topic: string;
        mode: string;
        quality: string;
        duration: string;
    }, files: {
        characterImage?: any[];
        productImage?: any[];
    }): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    devRecharge(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
