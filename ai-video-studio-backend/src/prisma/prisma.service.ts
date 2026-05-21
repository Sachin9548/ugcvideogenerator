import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Jab server start hoga toh database connect karega
  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database Connected Successfully!');
  }

  // Jab server band hoga toh connection close karega
  async onModuleDestroy() {
    await this.$disconnect();
  }
}