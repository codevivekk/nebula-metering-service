import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreateCompletionDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsArray()
  messages?: any[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_tokens?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;
}
