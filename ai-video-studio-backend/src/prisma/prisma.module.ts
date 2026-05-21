import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // @Global lagane se hume isko baar-baar import nahi karna padega
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export karna zaroori hai
})
export class PrismaModule {}