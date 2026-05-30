import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { VideoService } from './video.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('video-queue')
export class VideoProcessor extends WorkerHost {
  constructor(
    private readonly videoService: VideoService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`👷‍♂️ Worker started Job Type: ${job.name} | Job ID: ${job.id}`);

    try {
      // ==========================================
      // STANDARD STUDIO LOGIC (Kling V3 & Omni)
      // ==========================================
      if (job.name === 'generate-video-job') {
        const { userId, topic, mode, quality, duration, charBase64, prodBase64, engine } = job.data;
        let videoData;

        console.log(`🚀 Processing Standard Engine: ${mode} (${quality}) using ${engine || 'omni'} for user: ${userId}`);

          if (mode === 'Cinematic') {
          videoData = await this.videoService.createCinematicVideo(userId, topic, quality, duration);
        } else if (mode === 'UGC') {
          // 2. Pass 'engine' to the service call 👈
          videoData = await this.videoService.createUGCVideo(
            userId, 
            topic, 
            charBase64, 
            prodBase64, 
            quality, 
            duration,
            engine || 'omni'
          );
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

    } catch (error: any) {
      console.error(`❌ Background Job ${job.id} failed:`, error.message);
      
      // 🛡️ REFUND LOGIC: Agar Kling ya Gemini fail hua, toh credits wapas!
      let refundAmount = job.name === 'generate-advanced-job' ? 5 : 10;
      
      await this.prisma.user.update({
        where: { clerkId: job.data.userId },
        data: { credits: { increment: refundAmount } }
      });
      console.log(`💸 Refunded ${refundAmount} credits to user ${job.data.userId} because job failed.`);
      
      throw error;
    }
  }
}