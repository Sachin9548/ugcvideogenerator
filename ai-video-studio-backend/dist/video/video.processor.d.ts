import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { VideoService } from './video.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class VideoProcessor extends WorkerHost {
    private readonly videoService;
    private readonly prisma;
    constructor(videoService: VideoService, prisma: PrismaService);
    process(job: Job<any, any, string>): Promise<any>;
}
