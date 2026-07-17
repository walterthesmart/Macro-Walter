import { Injectable } from '@nestjs/common';
import { AxesService } from './axes.service';
import { HysteresisService } from './hysteresis.service';
import { GridMapperService } from './grid-mapper.service';
import { GlobalContextService } from './global-context.service';
import { RegimeSnapshot } from '../../database/entities/regime-snapshot.entity';

@Injectable()
export class RegimeEngine {
  constructor(
    private axesService: AxesService,
    private hysteresisService: HysteresisService,
    private gridMapper: GridMapperService,
    private globalContext: GlobalContextService,
  ) {}

  classify(
    rawAxes: RegimeSnapshot['rawAxes'],
    globalInputs: any,
    thresholdsConfig: import('../../database/entities/thresholds-config.entity').ThresholdsConfig,
    currentDate: string,
    previousSnapshot: RegimeSnapshot | null,
    seriesDates: Record<string, string> | null = null,
  ): Omit<RegimeSnapshot, 'id' | 'createdAt' | 'updatedAt'> {
    const prevAxes = previousSnapshot?.rawAxes;
    const prevHysteresis = previousSnapshot?.hysteresisState ?? null;
    const dataQuality = currentDate >= '2003-01-01' ? 'full' : 'degraded';

    const rawG = this.axesService.getGrowthState(rawAxes.cfnai_3ma, rawAxes.sahm, thresholdsConfig.config);
    const rawI = this.axesService.getInflationState(
      rawAxes.trimmed_pce_12m,
      prevAxes?.trimmed_pce_12m ?? rawAxes.trimmed_pce_12m,
      thresholdsConfig.config,
    );
    const prefix = this.axesService.getFinancialPrefix(rawAxes.nfci, thresholdsConfig.config);
    const sahmTriggered = rawAxes.sahm >= thresholdsConfig.config.sahm.recession;

    const { confirmedG, confirmedI, newState } = this.hysteresisService.apply(
      rawG,
      rawI,
      currentDate,
      prevHysteresis,
      sahmTriggered,
    );

    const regimeName = this.gridMapper.map(confirmedG, confirmedI);
    const global = this.globalContext.build(globalInputs, rawAxes);

    return {
      date: currentDate,
      dataQuality,
      thresholdsVersion: thresholdsConfig.version,
      growthState: confirmedG,
      inflationState: confirmedI,
      regimeName,
      financialPrefix: prefix,
      fullLabel: `${regimeName} under ${prefix} conditions`,
      rawAxes,
      rawGlobal: globalInputs,
      globalContext: global,
      hysteresisState: newState,
      seriesDates,
    };
  }
}
