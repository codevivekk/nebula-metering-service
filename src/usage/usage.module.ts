import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usage } from './entities/usage.entity';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usage])],
  providers: [UsageService],
  exports: [UsageService],
  controllers: [UsageController],
})
export class UsageModule {}
