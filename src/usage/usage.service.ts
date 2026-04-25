import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usage } from './entities/usage.entity';
import { PRICING } from './constants/pricing';

interface UsageQueryResult {
  date?: string;
  model: string;
  totalInputTokens: string | number;
  totalOutputTokens: string | number;
  requestCount: string | number;
}

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(Usage)
    private readonly usageRepository: Repository<Usage>,
  ) {}

  async logUsage(data: {
    apiKey: string;
    deploymentId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<void> {
    const usage = this.usageRepository.create(data);
    await this.usageRepository.save(usage);
  }

  async getUsage(filters: {
    apiKey?: string;
    from?: string;
    to?: string;
    groupBy?: 'day' | 'model';
  }) {
    const query = this.usageRepository.createQueryBuilder('usage');

    if (filters.apiKey) {
      query.andWhere('usage.apiKey = :apiKey', { apiKey: filters.apiKey });
    }

    if (filters.from) {
      query.andWhere('usage.timestamp >= :from', { from: filters.from });
    }

    if (filters.to) {
      query.andWhere('usage.timestamp <= :to', { to: filters.to });
    }

    if (filters.groupBy === 'day') {
      const results = (await query
        .select("strftime('%Y-%m-%d', usage.timestamp)", 'date')
        .addSelect('usage.model', 'model')
        .addSelect('SUM(usage.inputTokens)', 'totalInputTokens')
        .addSelect('SUM(usage.outputTokens)', 'totalOutputTokens')
        .addSelect('COUNT(*)', 'requestCount')
        .groupBy('date')
        .addGroupBy('usage.model')
        .getRawMany()) as UsageQueryResult[];

      return results.map((r) => ({
        ...r,
        totalCost: this.calculateCost(
          r.model,
          Number(r.totalInputTokens),
          Number(r.totalOutputTokens),
        ),
      }));
    } else if (filters.groupBy === 'model') {
      const results = (await query
        .select('usage.model', 'model')
        .addSelect('SUM(usage.inputTokens)', 'totalInputTokens')
        .addSelect('SUM(usage.outputTokens)', 'totalOutputTokens')
        .addSelect('COUNT(*)', 'requestCount')
        .groupBy('model')
        .getRawMany()) as UsageQueryResult[];

      return results.map((r) => ({
        ...r,
        totalCost: this.calculateCost(
          r.model,
          Number(r.totalInputTokens),
          Number(r.totalOutputTokens),
        ),
      }));
    } else {
      const results = await query.getMany();
      return results.map((u) => ({
        ...u,
        totalCost: this.calculateCost(u.model, u.inputTokens, u.outputTokens),
      }));
    }
  }

  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING.default;
    return inputTokens * pricing.input + outputTokens * pricing.output;
  }
}
