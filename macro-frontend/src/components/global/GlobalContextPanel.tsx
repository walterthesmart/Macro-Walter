import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RegimeSnapshot } from '../../api/regimeApi';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../ui/Badge';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface GlobalContextPanelProps {
  /** Current snapshot — drives the header badges and stat strip. */
  snapshot: RegimeSnapshot;
  /** Snapshot series DESC by as_of_date (latest first); last 24 months used. */
  series: RegimeSnapshot[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

interface GlobalPoint {
  date: string;
  usCli: number | null;
  g7Cli: number | null;
  broadDollar: number | null;
  brentWti: number | null;
  vix: number | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DD' -> 'Mon YY' */
function formatMonthTick(date: string): string {
  const m = Number(date.slice(5, 7));
  const label = MONTHS[m - 1] ?? '';
  return `${label} ${date.slice(2, 4)}`;
}

/** Picks ~6 evenly spaced tick values (dates) from the ascending chart data. */
function pickTicks(data: GlobalPoint[]): string[] {
  const n = data.length;
  if (n === 0) return [];
  if (n <= 6) return data.map((d) => d.date);
  return [0, 1, 2, 3, 4, 5].map((i) => data[Math.round((i * (n - 1)) / 5)].date);
}

type PadDomain = [(dataMin: number) => number, (dataMax: number) => number];

/** Auto domain with a little breathing room on both ends. */
function paddedDomain(frac = 0.08): PadDomain {
  return [
    (dataMin: number) => dataMin - Math.abs(dataMin) * frac - 0.5,
    (dataMax: number) => dataMax + Math.abs(dataMax) * frac + 0.5,
  ];
}

function fmt(value: number | null | undefined, digits = 2, prefix = ''): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${prefix}${value.toFixed(digits)}`;
}

function fmtSpread(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

/* Badge variant mappings per API contract v2 channel values. */

function synchronizationVariant(s: string): string {
  if (s === 'synchronized') return 'success';
  if (s === 'divergent') return 'warning';
  return 'neutral';
}

function marketStressVariant(s: string): string {
  if (s === 'low') return 'success';
  if (s === 'elevated') return 'warning';
  if (s === 'high') return 'danger';
  return 'neutral';
}

function commodityChannelVariant(s: string): string {
  if (s === 'spike') return 'danger';
  if (s === 'declining') return 'success';
  return 'neutral';
}

function dollarChannelVariant(s: string): string {
  if (s === 'strengthening') return 'warning';
  if (s === 'weakening') return 'success';
  return 'neutral';
}

/* ------------------------------------------------------------------ */
/* Shared chart styling                                                */
/* ------------------------------------------------------------------ */

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' };
const GRID = { strokeDasharray: '3 3', vertical: false, stroke: '#e2e8f0' } as const;
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
} as const;
const LEGEND_STYLE = { fontSize: 11, color: '#64748b' } as const;

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function ChartShell({
  title,
  children,
  headerRight,
}: {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        <div className="flex items-center gap-2">{headerRight}</div>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  badgeVariant,
  badgeText,
}: {
  label: string;
  value: string;
  badgeVariant: string;
  badgeText: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
      </div>
      <div className="mt-1">
        <Badge variant={badgeVariant}>{badgeText}</Badge>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function GlobalContextPanel({ snapshot, series }: GlobalContextPanelProps) {
  const context = snapshot.global_context;
  const current = snapshot.raw_global;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware chart chrome (series colors stay constant).
  const grid = { ...GRID, stroke: isDark ? '#334155' : '#e2e8f0' };
  const axisLineStroke = isDark ? '#334155' : '#e2e8f0';
  const tooltipStyle = isDark
    ? { ...TOOLTIP_STYLE, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0' }
    : TOOLTIP_STYLE;
  const usCliStroke = isDark ? '#cbd5e1' : '#1e293b';
  const elevatedLabelFill = isDark ? '#fbbf24' : '#b45309';
  const highLabelFill = isDark ? '#f87171' : '#dc2626';
  const stressAreaOpacity = isDark ? 0.04 : 0.06;

  // Series arrives DESC by date; take the latest 24 and flip to ascending.
  const chartData = useMemo<GlobalPoint[]>(() => {
    return series
      .slice(0, 24)
      .reverse()
      .map((s) => ({
        date: s.as_of_date,
        usCli: s.raw_global?.usCli ?? null,
        g7Cli: s.raw_global?.g7Cli ?? null,
        broadDollar: s.raw_global?.broadDollar ?? null,
        brentWti: s.raw_global?.brentWti ?? null,
        vix: s.raw_global?.vix ?? null,
      }));
  }, [series]);

  const ticks = useMemo(() => pickTicks(chartData), [chartData]);

  // Ceiling for the VIX "high stress" zone; at least 35 so the 30 line is visible.
  const vixCeiling = useMemo(() => {
    const max = chartData.reduce((acc, d) => Math.max(acc, d.vix ?? 0), 0);
    return Math.max(35, Math.ceil(max * 1.15));
  }, [chartData]);

  const hasData = chartData.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-500 dark:text-slate-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Global Context</h2>
      </div>

      {!hasData && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No global context history available for this period.</p>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* 1) US vs G7 CLI ---------------------------------------- */}
            <ChartShell
              title="US vs G7 CLI"
              headerRight={
                <>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    US − G7: {fmtSpread(context?.us_g7_spread)} pts
                  </span>
                  <Badge variant={synchronizationVariant(context?.synchronization ?? '')}>
                    {context?.synchronization ?? 'neutral'}
                  </Badge>
                </>
              }
            >
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid {...grid} />
                  <XAxis
                    dataKey="date"
                    ticks={ticks}
                    tickFormatter={formatMonthTick}
                    tick={AXIS_TICK}
                    axisLine={{ stroke: axisLineStroke }}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    domain={paddedDomain()}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => String(label)}
                    formatter={(value) => [fmt(typeof value === 'number' ? value : null), '']}
                  />
                  <Legend wrapperStyle={LEGEND_STYLE} iconSize={8} iconType="plainline" />
                  <ReferenceLine
                    y={100}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                  />
                  <Line
                    type="monotone"
                    dataKey="usCli"
                    name="US CLI"
                    stroke={usCliStroke}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="g7Cli"
                    name="G7 CLI"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartShell>

            {/* 2) Market stress — VIX ---------------------------------- */}
            <ChartShell
              title="Market stress — VIX"
              headerRight={
                <Badge variant={marketStressVariant(context?.market_stress ?? '')}>
                  {context?.market_stress ?? 'neutral'}
                </Badge>
              }
            >
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid {...grid} />
                  <XAxis
                    dataKey="date"
                    ticks={ticks}
                    tickFormatter={formatMonthTick}
                    tick={AXIS_TICK}
                    axisLine={{ stroke: axisLineStroke }}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, vixCeiling]}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => String(label)}
                    formatter={(value) => [fmt(typeof value === 'number' ? value : null), 'VIX']}
                  />
                  <ReferenceArea
                    y1={30}
                    y2={vixCeiling}
                    fill="#dc2626"
                    fillOpacity={stressAreaOpacity}
                    strokeOpacity={0}
                  />
                  <ReferenceLine
                    y={20}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: 'elevated', position: 'insideTopRight', fontSize: 10, fill: elevatedLabelFill }}
                    ifOverflow="extendDomain"
                  />
                  <ReferenceLine
                    y={30}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: 'high', position: 'insideTopRight', fontSize: 10, fill: highLabelFill }}
                    ifOverflow="extendDomain"
                  />
                  <Line
                    type="monotone"
                    dataKey="vix"
                    name="VIX"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartShell>

            {/* 3) Brent vs Broad Dollar -------------------------------- */}
            <ChartShell
              title="Brent vs Broad Dollar"
              headerRight={
                <>
                  <Badge variant={commodityChannelVariant(context?.commodity_channel ?? '')}>
                    {context?.commodity_channel ?? 'neutral'}
                  </Badge>
                  <Badge variant={dollarChannelVariant(context?.dollar_channel ?? '')}>
                    {context?.dollar_channel ?? 'neutral'}
                  </Badge>
                </>
              }
            >
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: -12 }}>
                  <CartesianGrid {...grid} />
                  <XAxis
                    dataKey="date"
                    ticks={ticks}
                    tickFormatter={formatMonthTick}
                    tick={AXIS_TICK}
                    axisLine={{ stroke: axisLineStroke }}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    yAxisId="brent"
                    domain={paddedDomain()}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v: number) => `$${Math.round(v)}`}
                  />
                  <YAxis
                    yAxisId="dollar"
                    orientation="right"
                    domain={paddedDomain()}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => String(label)}
                    formatter={(value, name) => [
                      fmt(typeof value === 'number' ? value : null, 2, name === 'Brent' ? '$' : ''),
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={LEGEND_STYLE} iconSize={8} iconType="plainline" />
                  <Line
                    yAxisId="brent"
                    type="monotone"
                    dataKey="brentWti"
                    name="Brent"
                    stroke="#b45309"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="dollar"
                    type="monotone"
                    dataKey="broadDollar"
                    name="Broad Dollar"
                    stroke="#475569"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartShell>
          </div>

          {/* Stat strip ---------------------------------------------- */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="US CLI"
              value={fmt(current?.usCli)}
              badgeVariant={synchronizationVariant(context?.synchronization ?? '')}
              badgeText={context?.synchronization ?? 'neutral'}
            />
            <StatCard
              label="G7 CLI"
              value={fmt(current?.g7Cli)}
              badgeVariant={synchronizationVariant(context?.synchronization ?? '')}
              badgeText={context?.synchronization ?? 'neutral'}
            />
            <StatCard
              label="Broad Dollar"
              value={fmt(current?.broadDollar)}
              badgeVariant={dollarChannelVariant(context?.dollar_channel ?? '')}
              badgeText={context?.dollar_channel ?? 'neutral'}
            />
            <StatCard
              label="Brent"
              value={fmt(current?.brentWti, 2, '$')}
              badgeVariant={commodityChannelVariant(context?.commodity_channel ?? '')}
              badgeText={context?.commodity_channel ?? 'neutral'}
            />
            <StatCard
              label="VIX"
              value={fmt(current?.vix)}
              badgeVariant={marketStressVariant(context?.market_stress ?? '')}
              badgeText={context?.market_stress ?? 'neutral'}
            />
          </div>
        </>
      )}
    </section>
  );
}
