import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service';
import { UsageService } from '../usage/usage.service';
import { CreateCompletionDto } from './dto/create-completion.dto';

@Injectable()
export class CompletionsService {
  constructor(
    private readonly deploymentsService: DeploymentsService,
    private readonly usageService: UsageService,
  ) {}

  async createCompletion(
    deploymentId: string,
    apiKey: string,
    createCompletionDto: CreateCompletionDto,
  ) {
    const deployment = await this.deploymentsService.findOne(deploymentId);

    // 1. Verify Status
    if (deployment.status !== 'ready') {
      throw new BadRequestException(
        `Deployment is not ready. Current status: ${deployment.status}`,
      );
    }

    // 2. Verify API Key
    if (deployment.apiKey !== apiKey) {
      throw new ForbiddenException(
        'The provided API key does not belong to this deployment',
      );
    }

    // 3. Mock Inference Logic
    const promptText =
      createCompletionDto.prompt ||
      JSON.stringify(createCompletionDto.messages || '');
    const prompt_tokens = Math.ceil(promptText.length / 4) || 1;

    // Semi-deterministic completion tokens for testing
    const completion_tokens = (prompt_tokens % 20) + 5;

    // 4. Log Usage (Persist after successful validation and inference simulation)
    await this.usageService.logUsage({
      apiKey,
      deploymentId,
      model: deployment.model,
      inputTokens: prompt_tokens,
      outputTokens: completion_tokens,
    });

    return {
      output: `This is a mock response for the model ${deployment.model}. Your prompt was ${prompt_tokens} tokens long.`,
      input_tokens: prompt_tokens,
      output_tokens: completion_tokens,
    };
  }
}
