import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('deployments')
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  model: string;

  @Column({ default: 'provisioning' })
  status: string;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  endpointUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
