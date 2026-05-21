import { Controller, Post, Req, Res, Headers, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Webhook } from 'svix';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('clerk')
  async handleClerkWebhook(
    @Req() req: any,
    @Res() res: Response,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    console.log("📥 Webhook request received!");

    // 1. Sabse pehle check karte hain ki Secret key mili ya nahi
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('❌ ERROR: CLERK_WEBHOOK_SECRET .env file mein nahi mili!');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false });
    }

    // 2. Check karte hain ki payload/rawBody mili ya nahi
    const payload = req.rawBody?.toString('utf8');
    if (!payload) {
      console.error('❌ ERROR: req.rawBody missing hai. (main.ts mein rawBody: true check karein)');
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false });
    }

    const headers = {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    };

    let evt: any;
    try {
      // Yahan Svix verify karega
      const wh = new Webhook(secret);
      evt = wh.verify(payload, headers);
    } catch (err:any) {
      console.error('❌ Webhook Verification Failed:', err.message);
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false });
    }

    // 3. Agar sab sahi raha, toh DB mein save karo
    if (evt.type === 'user.created') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0].email_address;

      try {
        await this.prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            credits: 0, // Naye user ko 0 credits milenge
          },
        });
        console.log(`✅ SUCCESS: Naya User DB mein save ho gaya: ${email}`);
      } catch (error:any) {
        console.error('⚠️ DB Save Error:', error.message);
      }
    }

    return res.status(HttpStatus.OK).json({ success: true });
  }
}