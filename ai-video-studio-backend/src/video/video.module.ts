import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // <-- Import zaroori hai
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoProcessor } from './video.processor';

@Module({
  imports: [
    // 👇 QUEUE YAHAN REGISTER HOGI TABHI CONTROLLER KO MILEGI
    BullModule.registerQueue({
      name: 'video-queue',
    }),
  ],
  controllers: [VideoController],
  providers: [VideoService, VideoProcessor],
})
export class VideoModule {}