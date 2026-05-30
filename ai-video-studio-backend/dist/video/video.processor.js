"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const video_service_1 = require("./video.service");
const prisma_service_1 = require("../prisma/prisma.service");
let VideoProcessor = class VideoProcessor extends bullmq_1.WorkerHost {
    videoService;
    prisma;
    constructor(videoService, prisma) {
        super();
        this.videoService = videoService;
        this.prisma = prisma;
    }
    async process(job) {
        console.log(`👷‍♂️ Worker started Job Type: ${job.name} | Job ID: ${job.id}`);
        try {
            if (job.name === 'generate-video-job') {
                const { userId, topic, mode, quality, duration, charBase64, prodBase64, engine } = job.data;
                let videoData;
                console.log(`🚀 Processing Standard Engine: ${mode} (${quality}) using ${engine || 'omni'} for user: ${userId}`);
                if (mode === 'Cinematic') {
                    videoData = await this.videoService.createCinematicVideo(userId, topic, quality, duration);
                }
                else if (mode === 'UGC') {
                    videoData = await this.videoService.createUGCVideo(userId, topic, charBase64, prodBase64, quality, duration, engine || 'omni');
                }
                console.log(`✅ Standard Job ${job.id} completed successfully!`);
                return videoData;
            }
            else if (job.name === 'generate-advanced-job') {
                const { userId, prompt, advancedMode, engine, uploadedImageUrl } = job.data;
                console.log(`🚀 Processing Advanced Engine: ${engine} for user: ${userId}`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                const finalAdvancedVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
                const savedVideo = await this.prisma.video.create({
                    data: {
                        prompt: `[Advanced: ${engine}] ${prompt}`,
                        style: 'Advanced',
                        status: 'completed',
                        videoUrl: finalAdvancedVideoUrl,
                        user: { connect: { clerkId: userId } },
                    },
                });
                console.log(`✅ Advanced Job ${job.id} completed!`);
                return savedVideo;
            }
        }
        catch (error) {
            console.error(`❌ Background Job ${job.id} failed:`, error.message);
            let refundAmount = job.name === 'generate-advanced-job' ? 5 : 10;
            await this.prisma.user.update({
                where: { clerkId: job.data.userId },
                data: { credits: { increment: refundAmount } }
            });
            console.log(`💸 Refunded ${refundAmount} credits to user ${job.data.userId} because job failed.`);
            throw error;
        }
    }
};
exports.VideoProcessor = VideoProcessor;
exports.VideoProcessor = VideoProcessor = __decorate([
    (0, bullmq_1.Processor)('video-queue'),
    __metadata("design:paramtypes", [video_service_1.VideoService,
        prisma_service_1.PrismaService])
], VideoProcessor);
//# sourceMappingURL=video.processor.js.map