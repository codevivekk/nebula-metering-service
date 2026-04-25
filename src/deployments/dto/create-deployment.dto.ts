import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  model: string;
}
