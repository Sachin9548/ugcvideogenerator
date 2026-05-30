import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { VideoModule } from './video/video.module'; 
import { StorageModule } from './storage/storage.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL, 
      },
    }),    
    
    PrismaModule,
    WebhooksModule,
    VideoModule,
    StorageModule, 
  ],
})
export class AppModule {}