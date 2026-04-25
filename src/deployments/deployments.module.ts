import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deployment } from './entities/deployment.entity';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Deployment])],
  exports: [TypeOrmModule, DeploymentsService],
  providers: [DeploymentsService],
  controllers: [DeploymentsController],
})
export class DeploymentsModule {}
