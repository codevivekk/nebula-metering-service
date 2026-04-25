import { Module } from '@nestjs/common';
import { CompletionsService } from './completions.service';
import { CompletionsController } from './completions.controller';
import { DeploymentsModule } from '../deployments/deployments.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [DeploymentsModule, UsageModule],
  providers: [CompletionsService],
  controllers: [CompletionsController],
})
export class CompletionsModule {}
