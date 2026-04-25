import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Deployment } from './entities/deployment.entity';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  async create(@Body() createDeploymentDto: CreateDeploymentDto) {
    const deployment =
      await this.deploymentsService.create(createDeploymentDto);
    return this.mapDeployment(deployment);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const deployment = await this.deploymentsService.findOne(id);
    return this.mapDeployment(deployment);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deploymentsService.remove(id);
  }

  private mapDeployment(deployment: Deployment) {
    return {
      deployment_id: deployment.id,
      status: deployment.status,
      api_key: deployment.status === 'ready' ? deployment.apiKey : undefined,
      endpoint_url: deployment.endpointUrl,
    };
  }
}
