import React from 'react';
import type { RegimeSnapshot } from '../../api/regimeApi';
import { hysteresisStatus } from '../../lib/regimeMeta';
import { Badge } from '../ui/Badge';
import type { SparklinePoint } from '../ui/Sparkline';
import { IndicatorCard } from './IndicatorCard';
import { SahmRuleGauge } from './SahmRuleGauge';

export interface IndicatorGardenProps {
  snapshot: RegimeSnapshot;
  /** Snapshots DESC by as_of_date (latest first), as returned by the API. */
  series: RegimeSnapshot[];
}

const SPARK_MONTHS = 24;

/** Builds an ascending-date spark array of the last N points from a DESC series. */
function buildSpark(
  series: RegimeSnapshot[],
  pick: (s: RegimeSnapshot) => number | null | undefined,
): SparklinePoint[] {
  return series
    .slice(0, SPARK_MONTHS)
    .map((s) => ({ date: s.as_of_date, value: pick(s) ?? null }))
    .reverse();
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

/**
 * Full indicator garden: growth, inflation, and financial-conditions groups.
 * All thresholds come from snapshot.thresholds; spark arrays are the last
 * 24 months of the raw_axes fields, ascending by date.
 */
export function IndicatorGarden({ snapshot, series }: IndicatorGardenProps) {
  const { raw_axes: raw, thresholds: t } = snapshot;
  const hs = hysteresisStatus(snapshot);

  const growthStatus =
    hs && hs.axis === 'growth' ? <Badge variant="warning">{hs.text}</Badge> : undefined;
  const inflationStatus =
    hs && hs.axis === 'inflation' ? <Badge variant="warning">{hs.text}</Badge> : undefined;

  const cfnaiGauge = {
    min: -1,
    max: 1,
    thresholds: [
      { value: t.cfnai.g_minus, label: `${t.cfnai.g_minus.toFixed(2)} G-`, color: '#dc2626' },
      { value: t.cfnai.g_plus, label: `+${t.cfnai.g_plus.toFixed(2)} G+`, color: '#059669' },
    ],
    zones: [
      { from: -1, to: t.cfnai.g_minus, color: '#fee2e2' },
      { from: t.cfnai.g_minus, to: t.cfnai.g_plus, color: '#e2e8f0' },
      { from: t.cfnai.g_plus, to: 1, color: '#d1fae5' },
    ],
  };

  const trimmedPceGauge = {
    min: 0,
    max: 5,
    thresholds: [
      { value: t.trimmedPce.target, label: `Fed target ${t.trimmedPce.target.toFixed(1)}`, color: '#059669' },
    ],
    zones: [
      {
        from: Math.max(0, t.trimmedPce.target - t.trimmedPce.band),
        to: t.trimmedPce.target + t.trimmedPce.band,
        color: '#d1fae5',
      },
    ],
  };

  const nfciGauge = {
    min: -1,
    max: 1,
    thresholds: [
      { value: t.nfci.accommodating, label: 'accommodative', color: '#059669' },
      { value: t.nfci.restrictive, label: 'neutral avg', color: '#64748b' },
      { value: t.nfci.stress, label: 'stress', color: '#dc2626' },
    ],
    zones: [{ from: t.nfci.stress, to: 1, color: '#fee2e2' }],
  };

  const spreadGauge = {
    min: -2,
    max: 2,
    thresholds: [{ value: t.spread.inversion, label: 'inversion', color: '#d97706' }],
    zones: [{ from: -2, to: t.spread.inversion, color: '#fef3c7' }],
  };

  const initialClaimsK = raw.initial_claims != null ? raw.initial_claims / 1000 : null;

  return (
    <div className="flex flex-col gap-8">
      <Group title="Growth">
        <SahmRuleGauge
          value={raw.sahm ?? null}
          threshold={t.sahm.recession}
          spark={buildSpark(series, (s) => s.raw_axes.sahm)}
        />
        <IndicatorCard
          title="CFNAI (3-mo avg)"
          value={raw.cfnai_3ma ?? null}
          decimals={2}
          accentHex="#475569"
          spark={buildSpark(series, (s) => s.raw_axes.cfnai_3ma)}
          gauge={cfnaiGauge}
          status={growthStatus}
          note="Chicago Fed national activity index; ±0.20 marks the G+/G- bands"
        />
        <IndicatorCard
          title="SOS — State Composite"
          value={raw.sos_indicator ?? null}
          decimals={2}
          accentHex="#78716c"
          spark={buildSpark(series, (s) => s.raw_axes.sos_indicator)}
          gauge={{
            min: 0,
            max: 1,
            thresholds: [
              {
                value: t.sos.early_recession,
                label: `early recession ${t.sos.early_recession.toFixed(2)}`,
                color: '#d97706',
              },
            ],
            zones: [{ from: t.sos.early_recession, to: 1, color: '#fef3c7' }],
          }}
          note="share of states with triggered Sahm rule"
        />
        <IndicatorCard
          title="Unemployment Rate"
          value={raw.unemployment ?? null}
          unit="%"
          decimals={1}
          accentHex="#57534e"
          spark={buildSpark(series, (s) => s.raw_axes.unemployment)}
          note="U-3 unemployment rate (UNRATE)"
        />
        <IndicatorCard
          title="Initial Claims"
          value={initialClaimsK}
          unit="k"
          decimals={0}
          accentHex="#57534e"
          spark={buildSpark(series, (s) =>
            s.raw_axes.initial_claims != null ? s.raw_axes.initial_claims / 1000 : null,
          )}
          note="weekly initial jobless claims, in thousands (ICSA)"
        />
      </Group>

      <Group title="Inflation">
        <IndicatorCard
          title="Trimmed Mean PCE (12-mo)"
          value={raw.trimmed_pce_12m ?? null}
          unit="%"
          decimals={2}
          accentHex="#b45309"
          spark={buildSpark(series, (s) => s.raw_axes.trimmed_pce_12m)}
          gauge={trimmedPceGauge}
          status={inflationStatus}
          note={`Dallas Fed trimmed mean; green band is target ± ${t.trimmedPce.band.toFixed(1)}pp`}
        />
        <IndicatorCard
          title="5Y5Y Forward Breakeven"
          value={raw.fwd_breakeven_5y5y ?? null}
          unit="%"
          decimals={2}
          accentHex="#0d9488"
          spark={buildSpark(series, (s) => s.raw_axes.fwd_breakeven_5y5y)}
          gauge={{
            min: 0,
            max: 4,
            thresholds: [
              {
                value: t.trimmedPce.target,
                label: `target ${t.trimmedPce.target.toFixed(1)}`,
                color: '#059669',
              },
            ],
          }}
          note="expected vs realized pairing — long-run inflation expectations (T5YIFR)"
        />
        <IndicatorCard
          title="Headline CPI (YoY)"
          value={raw.headline_cpi_yoy ?? null}
          unit="%"
          decimals={1}
          accentHex="#c2410c"
          spark={buildSpark(series, (s) => s.raw_axes.headline_cpi_yoy)}
          status={
            snapshot.global_context.headline_underlying_divergence ? (
              <Badge variant="warning">diverges from underlying &gt; 1pp</Badge>
            ) : undefined
          }
          note="headline CPI year-over-year (CPIAUCSL)"
        />
      </Group>

      <Group title="Financial Conditions">
        <IndicatorCard
          title="NFCI"
          value={raw.nfci ?? null}
          decimals={2}
          accentHex="#4d7c0f"
          spark={buildSpark(series, (s) => s.raw_axes.nfci)}
          gauge={nfciGauge}
          status={<Badge variant="neutral">{snapshot.regime.financial_prefix}</Badge>}
          note="Chicago Fed National Financial Conditions Index; negative = looser than average"
        />
        <IndicatorCard
          title="HY OAS"
          value={raw.hy_oas ?? null}
          unit="%"
          decimals={2}
          accentHex="#9f1239"
          spark={buildSpark(series, (s) => s.raw_axes.hy_oas)}
          note="ICE BofA high-yield spread"
        />
        <IndicatorCard
          title="Fed Funds Effective"
          value={raw.fed_funds ?? null}
          unit="%"
          decimals={2}
          accentHex="#334155"
          spark={buildSpark(series, (s) => s.raw_axes.fed_funds)}
          note="effective federal funds rate (FEDFUNDS)"
        />
        <IndicatorCard
          title="10Y–2Y Spread"
          value={raw.ten_two_spread ?? null}
          unit="%"
          decimals={2}
          accentHex="#a16207"
          spark={buildSpark(series, (s) => s.raw_axes.ten_two_spread)}
          gauge={spreadGauge}
          note="Treasury yield-curve slope (T10Y2Y); amber zone is inversion"
        />
        <IndicatorCard
          title="Net Liquidity"
          value={raw.net_liquidity ?? null}
          unit="$B"
          decimals={0}
          accentHex="#0f766e"
          spark={buildSpark(series, (s) => s.raw_axes.net_liquidity)}
          note="Fed Total Assets (WALCL) − Treasury General Account (TGA) − Overnight Reverse Repos (ON RRP)"
        />
      </Group>
    </div>
  );
}
