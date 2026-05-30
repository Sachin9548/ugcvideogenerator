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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const video_service_1 = require("./video.service");
const storage_service_1 = require("../storage/storage.service");
const prisma_service_1 = require("../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let VideoController = class VideoController {
    videoService;
    storageService;
    prisma;
    videoQueue;
    constructor(videoService, storageService, prisma, videoQueue) {
        this.videoService = videoService;
        this.storageService = storageService;
        this.prisma = prisma;
        this.videoQueue = videoQueue;
    }
    async getUserData(userId) {
        let user = await this.prisma.user.findUnique({
            where: { clerkId: userId },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: { clerkId: userId, email: `${userId}@fallback.com`, credits: 0 },
            });
        }
        return { success: true, credits: user.credits };
    }
    async getUserGallery(userId) {
        const videos = await this.prisma.video.findMany({
            where: {
                user: {
                    clerkId: userId
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data: videos };
    }
    async generateVideo(body, files) {
        const { userId, topic, mode, quality, duration, engine } = body;
        const user = await this.prisma.user.findUnique({
            where: { clerkId: userId },
        });
        if (!user || user.credits < 10)
            throw new common_1.BadRequestException('INSUFFICIENT_CREDITS');
        let videoData;
        try {
            if (mode === 'Cinematic') {
                videoData = await this.videoService.createCinematicVideo(userId, topic, quality, duration);
            }
            else if (mode === 'UGC') {
                if (!files || !files.characterImage || !files.productImage) {
                    throw new common_1.BadRequestException('UGC Mode requires both Character and Product images.');
                }
                this.storageService
                    .uploadFile(files.characterImage[0], 'characters')
                    .catch(console.error);
                this.storageService
                    .uploadFile(files.productImage[0], 'products')
                    .catch(console.error);
                const charBase64 = files.characterImage[0].buffer.toString('base64');
                const prodBase64 = files.productImage[0].buffer.toString('base64');
                videoData = await this.videoService.createUGCVideo(userId, topic, charBase64, prodBase64, quality, duration, engine);
            }
            await this.prisma.user.update({
                where: { clerkId: userId },
                data: { credits: { decrement: 10 } },
            });
            return {
                success: true,
                message: 'Video Generated! 10 Credits Deducted.',
                data: videoData,
            };
        }
        catch (error) {
            console.error(error);
            throw new common_1.BadRequestException(error.message || 'Video Generation Failed');
        }
    }
    async devRecharge(userId) {
        await this.prisma.user.update({
            where: { clerkId: userId },
            data: { credits: { increment: 50 } },
        });
        return { success: true, message: 'Recharged 50 credits!' };
    }
    async generateAdvancedVideo(body, files) {
        const { userId, prompt, advancedMode, engine } = body;
        const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || user.credits < 5)
            throw new common_1.BadRequestException('INSUFFICIENT_CREDITS');
        let uploadedImageUrl = null;
        if (files && files.image) {
            uploadedImageUrl = await this.storageService.uploadFile(files.image[0], 'advanced-assets');
        }
        const job = await this.videoQueue.add('generate-advanced-job', {
            userId, prompt, advancedMode, engine, uploadedImageUrl
        });
        await this.prisma.user.update({ where: { clerkId: userId }, data: { credits: { decrement: 5 } } });
        return { success: true, message: 'Advanced Job added to queue', jobId: job.id };
    }
};
exports.VideoController = VideoController;
__decorate([
    (0, common_1.Get)('user-data/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getUserData", null);
__decorate([
    (0, common_1.Get)('gallery/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getUserGallery", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'characterImage', maxCount: 1 },
        { name: 'productImage', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "generateVideo", null);
__decorate([
    (0, common_1.Get)('dev-recharge/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "devRecharge", null);
__decorate([
    (0, common_1.Post)('generate-advanced'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'image', maxCount: 1 }])),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "generateAdvancedVideo", null);
exports.VideoController = VideoController = __decorate([
    (0, common_1.Controller)('video'),
    __param(3, (0, bullmq_1.InjectQueue)('video-queue')),
    __metadata("design:paramtypes", [video_service_1.VideoService,
        storage_service_1.StorageService,
        prisma_service_1.PrismaService,
        bullmq_2.Queue])
], VideoController);
//# sourceMappingURL=video.controller.js.map