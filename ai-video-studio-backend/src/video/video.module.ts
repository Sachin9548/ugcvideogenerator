import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  controllers: [VideoController], // Controller ko yahan add karna zaroori hai
  providers: [VideoService],      // Service ko yahan add karna zaroori hai
})
export class VideoModule {}