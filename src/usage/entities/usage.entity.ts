import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Deployment } from '../../deployments/entities/deployment.entity';

@Entity('usage')
export class Usage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column()
  deploymentId: string;

  @ManyToOne(() => Deployment)
  deployment: Deployment;

  @Column()
  model: string;

  @Column()
  inputTokens: number;

  @Column()
  outputTokens: number;

  @CreateDateColumn()
  timestamp: Date;
}
