import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegimeSnapshot } from '../database/entities/regime-snapshot.entity';
import { ThresholdsConfig } from '../database/entities/thresholds-config.entity';
import { RegimeController } from './controllers/regime.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegimeSnapshot, ThresholdsConfig])],
  controllers: [RegimeController],
})
export class ApiModule {}
