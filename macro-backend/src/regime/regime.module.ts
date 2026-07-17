import { Module } from '@nestjs/common';
import { AxesService } from './services/axes.service';
import { HysteresisService } from './services/hysteresis.service';
import { GridMapperService } from './services/grid-mapper.service';
import { GlobalContextService } from './services/global-context.service';
import { RegimeEngine } from './services/regime-engine.service';

@Module({
  providers: [
    AxesService,
    HysteresisService,
    GridMapperService,
    GlobalContextService,
    RegimeEngine,
  ],
  exports: [RegimeEngine],
})
export class RegimeModule {}
