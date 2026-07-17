import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegimeSnapshot } from '../database/entities/regime-snapshot.entity';
import { ThresholdsConfig } from '../database/entities/thresholds-config.entity';
import { RegimeController } from './controllers/regime.controller';
import { AuthController } from './controllers/auth.controller';
import { DataFetcherModule } from '../data-fetcher/data-fetcher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegimeSnapshot, ThresholdsConfig]),
    DataFetcherModule,
  ],
  controllers: [RegimeController, AuthController],
})
export class ApiModule {}
