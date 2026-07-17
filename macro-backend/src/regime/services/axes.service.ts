import { Injectable } from '@nestjs/common';
import { GrowthState, InflationState, FinancialPrefix } from '../../database/entities/regime-snapshot.entity';

@Injectable()
export class AxesService {
  getGrowthState(cfnaim3: number, sahm: number, thresholds: any): GrowthState {
    if (sahm >= thresholds.sahm.recession) {
      return GrowthState.G_MINUS;
    }
    if (cfnaim3 > thresholds.cfnai.g_plus) return GrowthState.G_PLUS;
    if (cfnaim3 < thresholds.cfnai.g_minus) return GrowthState.G_MINUS;
    return GrowthState.G_EQUAL;
  }

  getInflationState(trimPce: number, prevTrimPce: number, thresholds: any): InflationState {
    if (trimPce > thresholds.trimmedPce.target && trimPce > prevTrimPce) {
      return InflationState.I_PLUS;
    }
    if (trimPce < thresholds.trimmedPce.target && trimPce < prevTrimPce) {
      return InflationState.I_MINUS;
    }
    return InflationState.I_EQUAL;
  }

  getFinancialPrefix(nfci: number, thresholds: any): FinancialPrefix {
    if (nfci > thresholds.nfci.stress) return FinancialPrefix.ACUTE_STRESS;
    if (nfci > thresholds.nfci.restrictive) return FinancialPrefix.RESTRICTIVE;
    if (nfci < thresholds.nfci.accommodating) return FinancialPrefix.ACCOMMODATING;
    return FinancialPrefix.NEUTRAL;
  }
}
