import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handleClerkWebhook(req: any, res: Response, svixId: string, svixTimestamp: string, svixSignature: string): Promise<Response<any, Record<string, any>>>;
}
