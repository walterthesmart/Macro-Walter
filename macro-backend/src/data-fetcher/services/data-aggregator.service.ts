import { Injectable, Logger } from '@nestjs/common';
import { FredClient } from '../clients/fred.client';

export interface SeriesObs {
  date: string;
  value: number;
}

export interface MacroInputs {
  axes: {
    cfnai_3ma: number;
    trimmed_pce_12m: number;
    nfci: number;
    sahm: number;
    ten_two_spread: number;
    sos_indicator: number | null;
    hy_oas: number | null;
    fed_funds: number | null;
    fwd_breakeven_5y5y: number | null;
    headline_cpi_yoy: number | null;
    unemployment: number | null;
    initial_claims: number | null;
    net_liquidity: number | null;
  };
  global: {
    usCli: number;
    g7Cli: number;
    broadDollar: number;
    vix: number;
    brentWti: number;
  };
  seriesDates: Record<string, string>;
}

@Injectable()
export class DataAggregatorService {
  private readonly logger = new Logger(DataAggregatorService.name);

  // Logical key -> FRED series id. `iur` feeds the SOS indicator (reported as `sos`).
  private static readonly SERIES: Record<string, string> = {
    cfnai: 'CFNAIMA3',
    trimmed_pce: 'PCETRIM12M159SFRBDAL',
    nfci: 'NFCI',
    sahm: 'SAHMREALTIME',
    ten_two_spread: 'T10Y2Y',
    us_cli: 'USALOLITOAASTSAM',
    g7_cli: 'G7LOLITOAASTSAM',
    broad_dollar: 'DTWEXBGS',
    vix: 'VIXCLS',
    brent: 'POILBREUSDM',
    t5yifr: 'T5YIFR',
    hy_oas: 'BAMLH0A0HYM2',
    fed_funds: 'FEDFUNDS',
    cpi: 'CPIAUCSL',
    unemployment: 'UNRATE',
    initial_claims: 'ICSA',
    walcl: 'WALCL',
    wtregen: 'WTREGEN',
    rrp: 'RRPONTSYD',
    iur: 'IURSA',
  };

  constructor(private fredClient: FredClient) {}

  async fetchAll(): Promise<MacroInputs> {
    const series = await this.fetchAllSeries();
    return this.buildInputs(series, null);
  }

  async fetchHistoryFrom2000(): Promise<Record<string, MacroInputs>> {
    const series = await this.fetchAllSeries();

    const result: Record<string, MacroInputs> = {};

    const startDate = new Date('2000-01-01T00:00:00Z');
    const today = new Date();

    let current = new Date(startDate);
    while (current <= today) {
      const dateStr = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}-01`;
      result[dateStr] = this.buildInputs(series, dateStr);
      current.setUTCMonth(current.getUTCMonth() + 1);
    }

    return result;
  }

  // ---------------------------------------------------------------------------

  private async fetchAllSeries(): Promise<Record<string, SeriesObs[]>> {
    const keys = Object.keys(DataAggregatorService.SERIES);
    const settled = await Promise.allSettled(
      keys.map((k) => this.fredClient.fetchSeries(DataAggregatorService.SERIES[k])),
    );

    const series: Record<string, SeriesObs[]> = {};
    settled.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        series[keys[i]] = res.value;
      } else {
        series[keys[i]] = [];
        this.logger.warn(
          `FRED fetch failed for ${keys[i]} (${DataAggregatorService.SERIES[keys[i]]}): ${res.reason?.message ?? res.reason}`,
        );
      }
    });
    return series;
  }

  /** Latest observation on or before `asOfDate` (YYYY-MM-DD). null `asOfDate` = latest available. */
  private latestOnOrBefore(arr: SeriesObs[], asOfDate: string | null): SeriesObs | null {
    if (!arr || arr.length === 0) return null;
    if (asOfDate === null) return arr[arr.length - 1];
    let lo = 0;
    let hi = arr.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].date <= asOfDate) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans >= 0 ? arr[ans] : null;
  }

  private round(value: number, decimals: number): number {
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
  }

  /** Headline CPI 12-month YoY % as of `asOfDate`. */
  private cpiYoy(cpi: SeriesObs[], asOfDate: string | null): number | null {
    const latest = this.latestOnOrBefore(cpi, asOfDate);
    if (!latest) return null;
    const [y, m, d] = latest.date.split('-').map(Number);
    const yearAgo = `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const prev = this.latestOnOrBefore(cpi, yearAgo);
    if (!prev || prev.value <= 0) return null;
    return this.round((latest.value / prev.value - 1) * 100, 2);
  }

  /**
   * SOS indicator (O'Trakoun & Scavette, Economics Letters 2025):
   * 26-week moving average of the insured unemployment rate (IURSA, weekly)
   * minus its minimum over the 52 preceding weeks. Recession signal > 0.2.
   */
  private sosIndicator(iur: SeriesObs[], asOfDate: string | null): { value: number; date: string } | null {
    if (!iur || iur.length === 0) return null;

    // Precompute the 26-week moving average (valid from index 25 onward).
    const ma26: (number | null)[] = new Array(iur.length).fill(null);
    let sum = 0;
    for (let i = 0; i < iur.length; i++) {
      sum += iur[i].value;
      if (i >= 26) sum -= iur[i - 26].value;
      if (i >= 25) ma26[i] = sum / 26;
    }

    const anchor = this.latestOnOrBefore(iur, asOfDate);
    if (!anchor) return null;
    const i = iur.indexOf(anchor);
    if (i < 25 + 52) return null; // need 52 preceding weeks of MA26 history

    let min = Infinity;
    for (let j = i - 52; j <= i - 1; j++) {
      const v = ma26[j];
      if (v !== null && v < min) min = v;
    }
    if (!isFinite(min) || ma26[i] === null) return null;
    return { value: this.round((ma26[i] as number) - min, 3), date: anchor.date };
  }

  /** Net liquidity = WALCL - WTREGEN - RRPONTSYD, in $ billions. Null when any leg is missing. */
  private netLiquidity(
    walcl: SeriesObs[],
    wtregen: SeriesObs[],
    rrp: SeriesObs[],
    asOfDate: string | null,
  ): number | null {
    const w = this.latestOnOrBefore(walcl, asOfDate); // millions of USD
    const tga = this.latestOnOrBefore(wtregen, asOfDate); // millions of USD
    const r = this.latestOnOrBefore(rrp, asOfDate); // billions of USD
    if (!w || !tga || !r) return null;
    return this.round((w.value - tga.value) / 1000 - r.value, 1);
  }

  private buildInputs(series: Record<string, SeriesObs[]>, asOfDate: string | null): MacroInputs {
    const latest = (key: string) => this.latestOnOrBefore(series[key] ?? [], asOfDate)?.value ?? null;
    const latestDate = (key: string) => this.latestOnOrBefore(series[key] ?? [], asOfDate)?.date ?? null;

    const sos = this.sosIndicator(series.iur ?? [], asOfDate);

    const seriesDates: Record<string, string> = {};
    const dateKeys = [
      'cfnai', 'trimmed_pce', 'nfci', 'sahm', 'ten_two_spread',
      'us_cli', 'g7_cli', 'broad_dollar', 'vix', 'brent',
      't5yifr', 'hy_oas', 'fed_funds', 'cpi', 'unemployment',
      'initial_claims', 'walcl', 'wtregen', 'rrp',
    ];
    for (const key of dateKeys) {
      const d = latestDate(key);
      if (d) seriesDates[key] = d;
    }
    if (sos) seriesDates['sos'] = sos.date;

    return {
      axes: {
        cfnai_3ma: latest('cfnai') ?? 0,
        trimmed_pce_12m: latest('trimmed_pce') ?? 2.0,
        nfci: latest('nfci') ?? 0,
        sahm: latest('sahm') ?? 0,
        ten_two_spread: latest('ten_two_spread') ?? 0,
        sos_indicator: sos?.value ?? null,
        hy_oas: latest('hy_oas'),
        fed_funds: latest('fed_funds'),
        fwd_breakeven_5y5y: latest('t5yifr'),
        headline_cpi_yoy: this.cpiYoy(series.cpi ?? [], asOfDate),
        unemployment: latest('unemployment'),
        initial_claims: latest('initial_claims'),
        net_liquidity: this.netLiquidity(series.walcl ?? [], series.wtregen ?? [], series.rrp ?? [], asOfDate),
      },
      global: {
        usCli: latest('us_cli') ?? 100,
        g7Cli: latest('g7_cli') ?? 100,
        broadDollar: latest('broad_dollar') ?? 110,
        vix: latest('vix') ?? 15,
        brentWti: latest('brent') ?? 75,
      },
      seriesDates,
    };
  }
}
