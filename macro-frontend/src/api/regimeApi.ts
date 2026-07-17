import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

export type GrowthState = 'G+' | 'G=' | 'G-';
export type InflationState = 'I+' | 'I=' | 'I-';

export interface RegimeHysteresis {
  lastConfirmedG: string;
  lastConfirmedI: string;
  pendingG: string | null;
  pendingI: string | null;
  pendingSince: string | null;
}

export interface RegimeThresholds {
  cfnai: { g_plus: number; g_minus: number };
  trimmedPce: { target: number; band: number };
  nfci: { accommodating: number; restrictive: number; stress: number };
  sahm: { recession: number };
  sos: { early_recession: number };
  spread: { inversion: number };
}

export interface RegimeSnapshot {
  version: string;
  as_of_date: string;
  data_quality: 'full' | 'degraded';
  revised: boolean;
  regime: {
    name: string;
    growth_state: GrowthState;
    inflation_state: InflationState;
    financial_prefix: string;
    full_label: string;
  };
  hysteresis: RegimeHysteresis | null;
  thresholds: RegimeThresholds;
  global_context: {
    synchronization: string;
    dollar_channel: string;
    commodity_channel: string;
    market_stress: string;
    headline_underlying_divergence: boolean;
    us_g7_spread: number;
  };
  raw_axes: {
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
  raw_global?: {
    usCli: number;
    g7Cli: number;
    broadDollar: number;
    brentWti: number;
    vix: number;
  };
  series_dates: Record<string, string> | null;
  timestamp: string;
}

export interface RegimeHistoryPagination {
  total: number;
  limit: number;
  offset: number;
}

export interface RegimeHistoryResponse {
  data: RegimeSnapshot[];
  pagination: RegimeHistoryPagination;
}

export async function fetchCurrentRegime(): Promise<RegimeSnapshot> {
  const { data } = await api.get('/api/v1/regime/current');
  return data;
}

export async function fetchRegimeByDate(date: string): Promise<RegimeSnapshot> {
  const { data } = await api.get('/api/v1/regime/classify', { params: { date } });
  return data;
}

export async function fetchRegimeHistory(params: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  regime?: string;
}) {
  const { data } = await api.get('/api/v1/regime/history', { params });
  return data;
}

/**
 * Long series of snapshots for sparklines / history ribbon.
 * Returns snapshots DESC by as_of_date (latest first), capped at `limit`.
 */
export async function fetchRegimeSeries(limit = 500): Promise<RegimeHistoryResponse> {
  const { data } = await api.get('/api/v1/regime/history', { params: { limit } });
  return data;
}
