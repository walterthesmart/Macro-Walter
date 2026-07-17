import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { RegimeSnapshot } from '../../database/entities/regime-snapshot.entity';
import { ThresholdsConfig } from '../../database/entities/thresholds-config.entity';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { DateQueryDto } from '../dto/date-query.dto';

@Controller('api/v1/regime')
export class RegimeController {
  constructor(
    @InjectRepository(RegimeSnapshot)
    private snapshotRepo: Repository<RegimeSnapshot>,
    @InjectRepository(ThresholdsConfig)
    private thresholdsRepo: Repository<ThresholdsConfig>,
  ) {}

  @Get('current')
  async getCurrent() {
    const snapshot = await this.snapshotRepo.findOne({
      where: {},
      order: { date: 'DESC' },
    });
    if (!snapshot) {
      throw new HttpException('No regime data available', HttpStatus.NOT_FOUND);
    }
    const thresholds = await this.getLatestThresholds();
    return this.formatResponse(snapshot, thresholds);
  }

  @Get('history')
  async getHistory(@Query() query: PaginationQueryDto) {
    const { limit = 50, offset = 0, from, to, regime } = query as any;
    const qb = this.snapshotRepo.createQueryBuilder('snapshot');

    if (from) qb.andWhere('snapshot.date >= :from', { from });
    if (to) qb.andWhere('snapshot.date <= :to', { to });
    if (regime) qb.andWhere('snapshot.regimeName = :regime', { regime });

    const [data, total] = await qb
      .orderBy('snapshot.date', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const thresholds = await this.getLatestThresholds();

    return {
      data: data.map((s) => this.formatResponse(s, thresholds)),
      pagination: { limit, offset, total },
    };
  }

  @Get('classify')
  async classifyByDate(@Query() query: DateQueryDto) {
    const { date } = query;
    const snapshot = await this.snapshotRepo.findOne({
      where: { date: LessThanOrEqual(date) },
      order: { date: 'DESC' },
    });
    if (!snapshot) {
      throw new HttpException(`No data available on or before ${date}`, HttpStatus.NOT_FOUND);
    }
    const thresholds = await this.getLatestThresholds();
    return this.formatResponse(snapshot, thresholds);
  }

  private getLatestThresholds(): Promise<ThresholdsConfig | null> {
    return this.thresholdsRepo.findOne({
      where: {},
      order: { effectiveFrom: 'DESC' },
    });
  }

  private formatResponse(snapshot: RegimeSnapshot, thresholds: ThresholdsConfig | null) {
    const revised =
      snapshot.updatedAt && snapshot.createdAt
        ? snapshot.updatedAt.getTime() - snapshot.createdAt.getTime() > 60 * 60 * 1000
        : false;

    return {
      version: snapshot.thresholdsVersion,
      as_of_date: snapshot.date,
      data_quality: snapshot.dataQuality,
      revised,
      regime: {
        name: snapshot.regimeName,
        growth_state: snapshot.growthState,
        inflation_state: snapshot.inflationState,
        financial_prefix: snapshot.financialPrefix,
        full_label: snapshot.fullLabel,
      },
      hysteresis: snapshot.hysteresisState ?? null,
      thresholds: thresholds?.config ?? null,
      global_context: snapshot.globalContext,
      raw_axes: snapshot.rawAxes,
      raw_global: snapshot.rawGlobal,
      series_dates: snapshot.seriesDates ?? null,
      timestamp: snapshot.createdAt,
    };
  }
}
