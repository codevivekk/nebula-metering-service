import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CompletionsService } from './completions.service';
import { CreateCompletionDto } from './dto/create-completion.dto';
import { ApiKeyThrottlerGuard } from '../common/guards/api-key-throttler.guard';

@Controller('v1')
@UseGuards(ApiKeyThrottlerGuard)
export class CompletionsController {
  constructor(private readonly completionsService: CompletionsService) {}

  @Post(':deploymentId/completions')
  create(
    @Param('deploymentId') deploymentId: string,
    @Headers('authorization') auth: string,
    @Headers('x-api-key') xApiKey: string,
    @Body() createCompletionDto: CreateCompletionDto,
  ) {
    let apiKey = xApiKey;

    if (auth && auth.startsWith('Bearer ')) {
      apiKey = auth.substring(7);
    }

    if (!apiKey) {
      throw new UnauthorizedException(
        'API Key is required (Authorization: Bearer <key> or x-api-key header)',
      );
    }
    return this.completionsService.createCompletion(
      deploymentId,
      apiKey,
      createCompletionDto,
    );
  }
}
