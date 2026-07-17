import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

@Entity('thresholds_config')
@Unique(['version'])
export class ThresholdsConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'jsonb' })
  config: {
    cfnai: { g_plus: number; g_minus: number };
    trimmedPce: { target: number; band: number };
    nfci: { accommodating: number; restrictive: number; stress: number };
    sahm: { recession: number };
    sos: { early_recession: number };
    spread: { inversion: number };
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
