import { Controller, Get, Query } from '@nestjs/common';
import { UsageService } from './usage.service';

@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  async getUsage(
    @Query('api_key') apiKey?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('group_by') groupBy?: 'day' | 'model',
  ) {
    const results = await this.usageService.getUsage({
      apiKey,
      from,
      to,
      groupBy,
    });

    const totalTokens = results.reduce(
      (acc, curr: any) =>
        acc +
        (Number(curr.totalInputTokens || curr.inputTokens) || 0) +
        (Number(curr.totalOutputTokens || curr.outputTokens) || 0),
      0,
    );

    const totalCost = results.reduce(
      (acc, curr: any) => acc + (Number(curr.totalCost || curr.cost) || 0),
      0,
    );

    return {
      total_tokens: totalTokens,
      total_cost: totalCost,
      breakdown: results,
    };
  }
}
