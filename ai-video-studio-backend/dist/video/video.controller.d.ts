import { VideoService } from './video.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class VideoController {
    private readonly videoService;
    private readonly storageService;
    private readonly prisma;
    private readonly videoQueue;
    constructor(videoService: VideoService, storageService: StorageService, prisma: PrismaService, videoQueue: Queue);
    getUserData(userId: string): Promise<{
        success: boolean;
        credits: number;
    }>;
    getUserGallery(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            prompt: string;
            style: string;
            status: string;
            videoUrl: string | null;
            userId: string;
        }[];
    }>;
    generateVideo(body: {
        userId: string;
        topic: string;
        mode: string;
        quality: string;
        duration: string;
        engine: 'omni' | 'standard';
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
    generateAdvancedVideo(body: {
        userId: string;
        prompt: string;
        advancedMode: string;
        engine: string;
    }, files: {
        image?: any[];
    }): Promise<{
        success: boolean;
        message: string;
        jobId: string | undefined;
    }>;
}
