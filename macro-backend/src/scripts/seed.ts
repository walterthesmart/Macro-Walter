import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ThresholdsConfig } from '../database/entities/thresholds-config.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataAggregatorService } from '../data-fetcher/services/data-aggregator.service';
import { RegimeEngine } from '../regime/services/regime-engine.service';
import { RegimeSnapshot } from '../database/entities/regime-snapshot.entity';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedScript');
  const app = await NestFactory.createApplicationContext(AppModule);

  const thresholdsRepo = app.get<Repository<ThresholdsConfig>>(getRepositoryToken(ThresholdsConfig));
  const snapshotRepo = app.get<Repository<RegimeSnapshot>>(getRepositoryToken(RegimeSnapshot));
  const aggregator = app.get(DataAggregatorService);
  const engine = app.get(RegimeEngine);

  // 1. Seed Thresholds
  logger.log('Seeding thresholds config...');
  await thresholdsRepo.clear();
  
  const thresholds = new ThresholdsConfig();
  thresholds.version = '1.0.0';
  thresholds.effectiveFrom = '2000-01-01';
  thresholds.config = {
    cfnai: { g_plus: 0.2, g_minus: -0.2 },
    trimmedPce: { target: 2.0, band: 0.5 },
    nfci: { accommodating: -0.5, restrictive: 0.0, stress: 0.4 },
    sahm: { recession: 0.5 },
    sos: { early_recession: 0.2 },
    spread: { inversion: 0.0 }
  };
  await thresholdsRepo.save(thresholds);
  logger.log('Thresholds seeded successfully.');

  // 2. Fetch Historical Data from 2000
  logger.log('Fetching historical data from FRED starting Jan 2000...');
  
  // Clear existing snapshots
  await snapshotRepo.clear();

  try {
    const history = await aggregator.fetchHistoryFrom2000();
    const sortedDates = Object.keys(history).sort();

    let previousSnapshot = null;
    for (const dateStr of sortedDates) {
      const rawData = history[dateStr];
      
      const newSnapshot = engine.classify(
        rawData.axes,
        rawData.global,
        thresholds,
        dateStr,
        previousSnapshot,
        rawData.seriesDates,
      );

      const saved = await snapshotRepo.save(newSnapshot);
      previousSnapshot = saved;
      logger.log(`-> Saved snapshot for ${dateStr}: ${saved.fullLabel}`);
    }
    
  } catch (e) {
    logger.error(`Failed to fetch and classify historical data:`, e.stack);
  }

  logger.log('Seeding complete! You can now view the dashboard.');
  await app.close();
}

bootstrap();
