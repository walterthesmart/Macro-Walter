import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

export enum GrowthState { G_PLUS = 'G+', G_EQUAL = 'G=', G_MINUS = 'G-' }
export enum InflationState { I_PLUS = 'I+', I_EQUAL = 'I=', I_MINUS = 'I-' }
export enum FinancialPrefix { ACCOMMODATING = 'accommodating', NEUTRAL = 'neutral', RESTRICTIVE = 'restrictive', ACUTE_STRESS = 'acute stress' }
export enum SyncState { SYNCHRONIZED = 'synchronized', DIVERGENT = 'divergent', NEUTRAL = 'neutral' }
export type DataQuality = 'full' | 'degraded';

@Entity('regime_snapshots')
@Unique(['date'])
export class RegimeSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'enum', enum: ['full', 'degraded'], default: 'full' })
  dataQuality: DataQuality;

  @Column({ name: 'thresholds_version', type: 'varchar', length: 20 })
  thresholdsVersion: string;

  @Column({ type: 'enum', enum: GrowthState })
  growthState: GrowthState;

  @Column({ type: 'enum', enum: InflationState })
  inflationState: InflationState;

  @Column({ name: 'regime_name', type: 'varchar', length: 100 })
  regimeName: string;

  @Column({ name: 'financial_prefix', type: 'varchar', length: 50 })
  financialPrefix: FinancialPrefix;

  @Column({ name: 'full_label', type: 'varchar', length: 150 })
  fullLabel: string;

  @Column({ type: 'jsonb', name: 'raw_axes' })
  rawAxes: {
    cfnai_3ma: number;
    trimmed_pce_12m: number;
    nfci: number;
    sahm: number;
    ten_two_spread: number;
    sos_indicator?: number | null;
    hy_oas?: number | null;
    fed_funds?: number | null;
    fwd_breakeven_5y5y?: number | null;
    headline_cpi_yoy?: number | null;
    unemployment?: number | null;
    initial_claims?: number | null;
    net_liquidity?: number | null;
  };

  @Column({ type: 'jsonb', name: 'series_dates', nullable: true })
  seriesDates: Record<string, string> | null;

  @Column({ type: 'jsonb', name: 'raw_global', nullable: true })
  rawGlobal: {
    usCli: number;
    g7Cli: number;
    broadDollar: number;
    brentWti: number;
    vix: number;
  };

  @Column({ type: 'jsonb', name: 'global_context' })
  globalContext: {
    synchronization: SyncState;
    dollar_channel: 'strengthening' | 'weakening' | 'neutral';
    commodity_channel: 'spike' | 'stable' | 'declining';
    market_stress: 'low' | 'elevated' | 'high';
    headline_underlying_divergence: boolean;
    us_g7_spread: number;
  };

  @Column({ type: 'jsonb', name: 'hysteresis_state', nullable: true })
  hysteresisState: {
    lastConfirmedG: GrowthState | null;
    lastConfirmedI: InflationState | null;
    pendingG: GrowthState | null;
    pendingI: InflationState | null;
    pendingSince: string | null;
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
