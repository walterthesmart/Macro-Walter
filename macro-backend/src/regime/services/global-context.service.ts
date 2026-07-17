import { Injectable } from '@nestjs/common';
import { SyncState } from '../../database/entities/regime-snapshot.entity';

@Injectable()
export class GlobalContextService {
  build(
    globalInputs: { usCli: number; g7Cli: number; broadDollar: number; brentWti: number; vix: number; ciss?: number },
    axes?: { headline_cpi_yoy?: number | null; trimmed_pce_12m?: number | null },
  ): any {
    const usDev = globalInputs.usCli - 100;
    const g7Dev = globalInputs.g7Cli - 100;
    const sync = (usDev * g7Dev > 0) ? SyncState.SYNCHRONIZED : (usDev !== 0 || g7Dev !== 0) ? SyncState.DIVERGENT : SyncState.NEUTRAL;

    const dollar = globalInputs.broadDollar > 115 ? 'strengthening' : globalInputs.broadDollar < 105 ? 'weakening' : 'neutral';
    const commodity = globalInputs.brentWti > 80 ? 'spike' : globalInputs.brentWti < 50 ? 'declining' : 'stable';
    const stress = globalInputs.vix > 30 ? 'high' : globalInputs.vix > 20 ? 'elevated' : 'low';

    const headlineDivergence =
      axes?.headline_cpi_yoy != null && axes?.trimmed_pce_12m != null
        ? Math.abs(axes.headline_cpi_yoy - axes.trimmed_pce_12m) > 1.0
        : false;

    return {
      synchronization: sync,
      dollar_channel: dollar,
      commodity_channel: commodity,
      market_stress: stress,
      headline_underlying_divergence: headlineDivergence,
      us_g7_spread: Math.round((globalInputs.usCli - globalInputs.g7Cli) * 1000) / 1000,
    };
  }
}
