import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deployment } from './entities/deployment.entity';
import { CreateDeploymentDto } from './dto/create-deployment.dto';

@Injectable()
export class DeploymentsService {
  constructor(
    @InjectRepository(Deployment)
    private readonly deploymentsRepository: Repository<Deployment>,
  ) {}

  async create(createDeploymentDto: CreateDeploymentDto): Promise<Deployment> {
    const deployment = this.deploymentsRepository.create({
      ...createDeploymentDto,
      status: 'provisioning',
    });
    const savedDeployment = await this.deploymentsRepository.save(deployment);

    // Transition to ready after 10 seconds
    setTimeout(() => {
      void this.transitionToReady(savedDeployment.id);
    }, 10000);

    return savedDeployment;
  }

  private async transitionToReady(id: string) {
    const deployment = await this.deploymentsRepository.findOne({
      where: { id },
    });

    // Only transition if it's still in provisioning state
    if (!deployment || deployment.status !== 'provisioning') {
      return;
    }

    const apiKey = `sk-${Math.random().toString(36).substring(2, 15)}`;
    const endpointUrl = `https://api.metered-service.com/v1/deployments/${id}`;

    await this.deploymentsRepository.update(id, {
      status: 'ready',
      apiKey,
      endpointUrl,
    });
  }

  async findOne(id: string): Promise<Deployment> {
    const deployment = await this.deploymentsRepository.findOne({
      where: { id },
    });
    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }
    return deployment;
  }

  async remove(id: string): Promise<void> {
    const deployment = await this.findOne(id);

    if (deployment.status === 'terminated') {
      throw new BadRequestException(
        `Deployment with ID ${id} is already terminated`,
      );
    }

    await this.deploymentsRepository.update(id, {
      status: 'terminated',
    });
  }
}
