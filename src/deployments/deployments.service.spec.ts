import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeploymentsService } from './deployments.service';
import { Deployment } from './entities/deployment.entity';
import { BadRequestException } from '@nestjs/common';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let repository: any;

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((deployment) =>
      Promise.resolve({ id: 'uuid', ...deployment }),
    ),
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentsService,
        {
          provide: getRepositoryToken(Deployment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeploymentsService>(DeploymentsService);
    repository = module.get(getRepositoryToken(Deployment));
  });

  it('should create a deployment in provisioning state', async () => {
    const dto = { model: 'gpt-4o' };
    const result = await service.create(dto);

    expect(result.status).toBe('provisioning');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw BadRequestException when deleting an already terminated deployment', async () => {
    const id = 'uuid';
    repository.findOne.mockResolvedValue({ id, status: 'terminated' });

    await expect(service.remove(id)).rejects.toThrow(BadRequestException);
  });
});
