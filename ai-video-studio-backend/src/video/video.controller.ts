import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('user-data/:userId')
  async getUserData(@Param('userId') userId: string) {
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

  @Get('gallery/:userId')
  async getUserGallery(@Param('userId') userId: string) {
    const videos = await this.prisma.video.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: videos };
  }

  @Post('generate')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'characterImage', maxCount: 1 },
      { name: 'productImage', maxCount: 1 },
    ]),
  )
  async generateVideo(
    // 👇 Quality aur Duration add kiye gaye hain
    @Body()
    body: {
      userId: string;
      topic: string;
      mode: string;
      quality: string;
      duration: string;
    },
    @UploadedFiles() files: { characterImage?: any[]; productImage?: any[] },
  ) {
    const { userId, topic, mode, quality, duration } = body;

    const user = await this.prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user || user.credits < 10)
      throw new BadRequestException('INSUFFICIENT_CREDITS');

    let videoData: any;

    try {
      if (mode === 'Cinematic') {
        videoData = await this.videoService.createCinematicVideo(
          userId,
          topic,
          quality,
          duration,
        );
      } else if (mode === 'UGC') {
        if (!files || !files.characterImage || !files.productImage) {
          throw new BadRequestException(
            'UGC Mode requires both Character and Product images.',
          );
        }

        this.storageService
          .uploadFile(files.characterImage[0], 'characters')
          .catch(console.error);
        this.storageService
          .uploadFile(files.productImage[0], 'products')
          .catch(console.error);

        const charBase64 = files.characterImage[0].buffer.toString('base64');
        const prodBase64 = files.productImage[0].buffer.toString('base64');

        videoData = await this.videoService.createUGCVideo(
          userId,
          topic,
          charBase64,
          prodBase64,
          quality,
          duration,
        );
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
    } catch (error: any) {
      console.error(error);
      throw new BadRequestException(error.message || 'Video Generation Failed');
    }
  }

  @Get('dev-recharge/:userId')
  async devRecharge(@Param('userId') userId: string) {
    await this.prisma.user.update({
      where: { clerkId: userId },
      data: { credits: { increment: 50 } },
    });
    return { success: true, message: 'Recharged 50 credits!' };
  }
}
