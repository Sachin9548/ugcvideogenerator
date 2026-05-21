import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { VideoModule } from './video/video.module'; // <-- Yeh import kiya
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WebhooksModule,
    VideoModule,
    StorageModule, 
  ],
})
export class AppModule {}