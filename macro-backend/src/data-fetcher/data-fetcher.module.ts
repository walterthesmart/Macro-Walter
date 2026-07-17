import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegimeSnapshot } from '../database/entities/regime-snapshot.entity';
import { ThresholdsConfig } from '../database/entities/thresholds-config.entity';
import { RegimeModule } from '../regime/regime.module';
import { FredClient } from './clients/fred.client';
import { DataAggregatorService } from './services/data-aggregator.service';
import { DataSchedulerService } from './services/data-scheduler.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([RegimeSnapshot, ThresholdsConfig]),
    RegimeModule,
  ],
  providers: [FredClient, DataAggregatorService, DataSchedulerService],
  exports: [DataAggregatorService],
})
export class DataFetcherModule {}
