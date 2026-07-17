import type { RegimeSnapshot } from '../api/regimeApi';

/* ------------------------------------------------------------------ */
/* Regime metadata                                                     */
/* ------------------------------------------------------------------ */

export type RegimeName =
  | 'Overheating'
  | 'Balanced Expansion'
  | 'Disinflationary Expansion'
  | 'Inflationary Pressure'
  | 'Transition'
  | 'Transition / Mixed signals'
  | 'Slowdown'
  | 'Stagflation'
  | 'Disinflationary Contraction';

export interface RegimeMeta {
  /** Low-saturation accent color for charts, dots, and the history ribbon. */
  hex: string;
  /** Soft pill classes: bg-50 / text-700 / border, with matching dark: variants. */
  softClasses: string;
  /** Exactly two plain sentences on what the regime typically means. */
  description: string;
  /** Historical analogue, where one fits. */
  analog: string;
}

const TRANSITION_META: RegimeMeta = {
  hex: '#64748b',
  softClasses: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800',
  description:
    'Growth is near trend and inflation is stable, but the underlying indicators are shifting direction. These regimes are usually short-lived bridges toward a clearer growth or inflation trend.',
  analog: 'Late-cycle handoffs (e.g. 2007–08)',
};

export const REGIME_META: Record<RegimeName, RegimeMeta> = {
  Overheating: {
    hex: '#d97706',
    softClasses: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    description:
      'Growth is running above trend while inflation accelerates, a combination that usually pushes central banks toward tighter policy. Financial conditions often stay loose until the tightening bites, so risk appetite can persist alongside rising rate risk.',
    analog: '2021 reflation',
  },
  'Balanced Expansion': {
    hex: '#059669',
    softClasses: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    description:
      'Growth is above trend with inflation stable near target, the classic goldilocks configuration. Monetary policy can stay patient, and risk assets usually benefit from earnings growth without rate pressure.',
    analog: '1995–99',
  },
  'Disinflationary Expansion': {
    hex: '#0d9488',
    softClasses: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    description:
      'Growth is above trend while inflation decelerates toward target, the soft-landing sweet spot. Central banks gain room to ease, which typically supports both bonds and equities.',
    analog: '2023–24 soft landing',
  },
  'Inflationary Pressure': {
    hex: '#ea580c',
    softClasses: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    description:
      'Growth is near trend but inflation is accelerating, squeezing real incomes and margins. Central banks typically tighten into the pressure, raising the risk of a policy-induced slowdown.',
    analog: '2022 tightening',
  },
  Transition: TRANSITION_META,
  // Backend grid-mapper emits this longer label for the same G=/I= state.
  'Transition / Mixed signals': TRANSITION_META,
  Slowdown: {
    hex: '#78716c',
    softClasses: 'bg-stone-100 text-stone-700 border border-stone-300 dark:bg-stone-950/40 dark:text-stone-300 dark:border-stone-800',
    description:
      'Growth is slipping toward or below trend while inflation eases, usually reflecting tightening credit or fading demand. Policy typically pivots toward support as recession risk builds.',
    analog: '2008–09 (early phase)',
  },
  Stagflation: {
    hex: '#dc2626',
    softClasses: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    description:
      'Growth is contracting while inflation still accelerates, the hardest mix for policymakers. Equities and bonds can struggle together because easing risks entrenching inflation.',
    analog: '1970s; echoes of 2022 tightening',
  },
  'Disinflationary Contraction': {
    hex: '#475569',
    softClasses: 'bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800',
    description:
      'Growth is contracting and inflation is falling, the classic recession configuration. Central banks usually cut rates aggressively, and long-duration bonds tend to outperform.',
    analog: '2020 COVID',
  },
};

/** Safe lookup with a neutral fallback for unknown regime labels. */
export function getRegimeMeta(name: string): RegimeMeta {
  return (REGIME_META as Record<string, RegimeMeta>)[name] ?? REGIME_META.Transition;
}

/* ------------------------------------------------------------------ */
/* Financial-conditions prefix metadata                                */
/* ------------------------------------------------------------------ */

export type FinancialPrefix = 'accommodating' | 'neutral' | 'restrictive' | 'acute stress';

export const FINANCIAL_PREFIX_META: Record<FinancialPrefix, string> = {
  accommodating: 'Financial conditions are loose, amplifying the underlying growth and inflation regime.',
  neutral: 'Financial conditions are neither helping nor hindering the underlying regime.',
  restrictive: 'Financial conditions are tight, dampening the underlying growth and inflation regime.',
  'acute stress': 'Financial markets are in acute stress, dominating the underlying macro signal.',
};

/** Safe prefix lookup with a neutral fallback. */
export function getFinancialPrefixText(prefix: string): string {
  return (
    (FINANCIAL_PREFIX_META as Record<string, string>)[prefix] ?? FINANCIAL_PREFIX_META.neutral
  );
}

/* ------------------------------------------------------------------ */
/* Axis state labels                                                   */
/* ------------------------------------------------------------------ */

export function growthStateLabel(state: string): string {
  switch (state) {
    case 'G+':
      return 'Above Trend';
    case 'G=':
      return 'On Trend';
    case 'G-':
      return 'Contracting';
    default:
      return state;
  }
}

export function inflationStateLabel(state: string): string {
  switch (state) {
    case 'I+':
      return 'Acceleration';
    case 'I=':
      return 'Stable';
    case 'I-':
      return 'Disinflation';
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Regime episodes                                                     */
/* ------------------------------------------------------------------ */

export interface RegimeEpisode {
  regime: string;
  start: string;
  end: string;
  months: number;
}

export interface RegimeEpisodeStats {
  currentMonths: number;
  medianMonths: number;
  episodes: RegimeEpisode[];
}

/**
 * Groups a snapshot series into consecutive same-regime episodes.
 * The API returns the series DESC by as_of_date; it is sorted ascending
 * internally. `currentMonths` is the length of the latest episode and
 * `medianMonths` the median episode length across the full series.
 */
export function computeRegimeEpisodes(series: RegimeSnapshot[]): RegimeEpisodeStats {
  const sorted = [...series].sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));
  const episodes: RegimeEpisode[] = [];

  for (const snap of sorted) {
    const name = snap.regime.name;
    const last = episodes[episodes.length - 1];
    if (last && last.regime === name) {
      last.end = snap.as_of_date;
      last.months += 1;
    } else {
      episodes.push({ regime: name, start: snap.as_of_date, end: snap.as_of_date, months: 1 });
    }
  }

  const currentMonths = episodes.length > 0 ? episodes[episodes.length - 1].months : 0;

  const lengths = episodes.map((e) => e.months).sort((a, b) => a - b);
  let medianMonths = 0;
  if (lengths.length > 0) {
    const mid = Math.floor(lengths.length / 2);
    medianMonths = lengths.length % 2 === 1 ? lengths[mid] : (lengths[mid - 1] + lengths[mid]) / 2;
  }

  return { currentMonths, medianMonths, episodes };
}

/* ------------------------------------------------------------------ */
/* Hysteresis status                                                   */
/* ------------------------------------------------------------------ */

export interface HysteresisStatus {
  axis: 'growth' | 'inflation';
  pendingTo: string;
  since: string;
  text: string;
}

/** Whole-month gap between two ISO date strings (YYYY-MM-DD), clamped at 0. */
function monthGap(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  if (!fy || !fm || !ty || !tm) return 0;
  return Math.max(0, (ty - fy) * 12 + (tm - fm));
}

/**
 * Derives a human-readable hysteresis status from a snapshot, or null when
 * no axis change is pending. Requires two consecutive months to confirm a
 * state change, so the month count is derived from pendingSince vs as_of_date.
 */
export function hysteresisStatus(snapshot: RegimeSnapshot): HysteresisStatus | null {
  const h = snapshot.hysteresis;
  if (!h) return null;

  const axis: 'growth' | 'inflation' | null = h.pendingG ? 'growth' : h.pendingI ? 'inflation' : null;
  const pendingTo = h.pendingG ?? h.pendingI;
  if (!axis || !pendingTo || !h.pendingSince) return null;

  const since = h.pendingSince;
  const monthCount = Math.min(Math.max(monthGap(since, snapshot.as_of_date) + 1, 1), 2);

  return {
    axis,
    pendingTo,
    since,
    text: `Month ${monthCount} of 2 pending ${pendingTo} — unconfirmed`,
  };
}

/* ------------------------------------------------------------------ */
/* Series freshness metadata                                           */
/* ------------------------------------------------------------------ */

export interface SeriesFreshnessMeta {
  label: string;
  expectedLagWeeks: number;
  source: string;
}

export type SeriesKey =
  | 'cfnai'
  | 'trimmed_pce'
  | 'nfci'
  | 'sahm'
  | 'ten_two_spread'
  | 'us_cli'
  | 'g7_cli'
  | 'broad_dollar'
  | 'vix'
  | 'brent'
  | 't5yifr'
  | 'hy_oas'
  | 'fed_funds'
  | 'cpi'
  | 'unemployment'
  | 'initial_claims'
  | 'walcl'
  | 'wtregen'
  | 'rrp'
  | 'sos';

export const SERIES_FRESHNESS_META: Record<SeriesKey, SeriesFreshnessMeta> = {
  cfnai: { label: 'CFNAI (3-mo avg)', expectedLagWeeks: 4, source: 'Chicago Fed / FRED (CFNAIMA3)' },
  trimmed_pce: {
    label: 'Trimmed Mean PCE (12-mo)',
    expectedLagWeeks: 4,
    source: 'Dallas Fed / FRED (PCETRIM12M159SFRBDAL)',
  },
  nfci: { label: 'NFCI', expectedLagWeeks: 1, source: 'Chicago Fed / FRED (NFCI)' },
  sahm: { label: 'Sahm Rule', expectedLagWeeks: 2, source: 'FRED (SAHMREALTIME)' },
  ten_two_spread: { label: '10Y–2Y Treasury Spread', expectedLagWeeks: 0.5, source: 'FRED (T10Y2Y)' },
  us_cli: { label: 'US Composite Leading Indicator', expectedLagWeeks: 6, source: 'OECD' },
  g7_cli: { label: 'G7 Composite Leading Indicator', expectedLagWeeks: 6, source: 'OECD' },
  broad_dollar: { label: 'Broad Dollar Index', expectedLagWeeks: 1, source: 'FRED (DTWEXBGS)' },
  vix: { label: 'VIX', expectedLagWeeks: 0.5, source: 'CBOE / FRED (VIXCLS)' },
  brent: { label: 'Brent Crude', expectedLagWeeks: 2, source: 'FRED (DCOILBDOCO)' },
  t5yifr: { label: '5Y5Y Forward Inflation Expectation', expectedLagWeeks: 0.5, source: 'FRED (T5YIFR)' },
  hy_oas: { label: 'High Yield OAS', expectedLagWeeks: 0.5, source: 'FRED (BAMLH0A0HYM2)' },
  fed_funds: { label: 'Effective Fed Funds Rate', expectedLagWeeks: 4, source: 'FRED (FEDFUNDS)' },
  cpi: { label: 'Headline CPI (YoY)', expectedLagWeeks: 3, source: 'BLS / FRED (CPIAUCSL)' },
  unemployment: { label: 'Unemployment Rate', expectedLagWeeks: 2, source: 'BLS / FRED (UNRATE)' },
  initial_claims: { label: 'Initial Claims', expectedLagWeeks: 1, source: 'DOL / FRED (ICSA)' },
  walcl: { label: 'Fed Balance Sheet (WALCL)', expectedLagWeeks: 1, source: 'FRED (WALCL)' },
  wtregen: { label: 'Treasury General Account', expectedLagWeeks: 1, source: 'FRED (WTREGEN)' },
  rrp: { label: 'ON RRP Balance', expectedLagWeeks: 0.5, source: 'FRED (RRPONTSYD)' },
  sos: {
    label: 'State Coincident Composite (SOS)',
    expectedLagWeeks: 2,
    source: "O'Trakoun & Scavette state-level composite (best effort)",
  },
};
