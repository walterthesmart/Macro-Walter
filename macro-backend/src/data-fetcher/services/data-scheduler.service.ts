import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataAggregatorService } from './data-aggregator.service';
import { RegimeEngine } from '../../regime/services/regime-engine.service';
import { RegimeSnapshot } from '../../database/entities/regime-snapshot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThresholdsConfig } from '../../database/entities/thresholds-config.entity';

@Injectable()
export class DataSchedulerService {
  private readonly logger = new Logger(DataSchedulerService.name);

  constructor(
    private aggregator: DataAggregatorService,
    private engine: RegimeEngine,
    @InjectRepository(RegimeSnapshot)
    private snapshotRepo: Repository<RegimeSnapshot>,
    @InjectRepository(ThresholdsConfig)
    private thresholdsRepo: Repository<ThresholdsConfig>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async runClassification() {
    this.logger.log('Starting scheduled macro regime classification...');

    try {
      const thresholds = await this.thresholdsRepo.findOne({
        where: {},
        order: { effectiveFrom: 'DESC' },
      });
      
      if (!thresholds) {
        this.logger.warn('No thresholds configured, skipping classification.');
        return;
      }

      const rawData = await this.aggregator.fetchAll();
      const currentDate = this.getFirstOfCurrentMonth();

      const previous = await this.snapshotRepo.findOne({
        where: { date: this.getPreviousMonth(currentDate) },
        order: { date: 'DESC' },
      });

      const newSnapshot = this.engine.classify(
        rawData.axes,
        rawData.global,
        thresholds,
        currentDate,
        previous,
        rawData.seriesDates,
      );

      const existing = await this.snapshotRepo.findOne({ where: { date: currentDate }});
      if (existing) {
        await this.snapshotRepo.update({ date: currentDate }, newSnapshot);
      } else {
        await this.snapshotRepo.save(newSnapshot);
      }

      this.logger.log(`Regime saved for ${currentDate}: ${newSnapshot.regimeName}`);
    } catch (error) {
      this.logger.error('Classification job failed', error.stack);
    }
  }

  private getFirstOfCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private getPreviousMonth(date: string): string {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
