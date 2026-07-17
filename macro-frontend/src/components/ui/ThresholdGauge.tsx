import type { CSSProperties } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface GaugeThreshold {
  value: number;
  label: string;
  color?: string;
}

export interface GaugeZone {
  from: number;
  to: number;
  color: string;
}

interface ThresholdGaugeProps {
  value: number | null;
  min: number;
  max: number;
  thresholds: GaugeThreshold[];
  zones?: GaugeZone[];
  /** Appended to the current-value label, e.g. '%' or 'k'. */
  unit?: string;
}

function formatValue(v: number, unit: string): string {
  const rounded = Math.abs(v) >= 100 ? Math.round(v).toString() : Number(v.toFixed(2)).toString();
  return `${rounded}${unit}`;
}

/**
 * Horizontal threshold gauge built with plain divs (no chart library).
 * Shows a subtle track with optional colored zones, threshold tick lines
 * with alternating labels above/below, and a prominent current-value dot.
 * Out-of-range values are clamped to the bar ends with an arrow cue.
 */
export function ThresholdGauge({
  value,
  min,
  max,
  thresholds,
  zones = [],
  unit = '',
}: ThresholdGaugeProps) {
  const { theme } = useTheme();
  // Tick lines are inline styles, so the slate fallback follows the theme.
  const tickFallback = theme === 'dark' ? '#94a3b8' : '#64748b';

  const span = max - min > 0 ? max - min : 1;
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const pct = (v: number) => ((clamp(v) - min) / span) * 100;

  const hasValue = value != null && Number.isFinite(value);
  const aboveMax = hasValue && (value as number) > max;
  const belowMin = hasValue && (value as number) < min;

  const labelStyle = (v: number): CSSProperties => ({ left: `${pct(v)}%` });

  return (
    <div className="w-full select-none">
      {/* Top row: odd-index threshold labels + current-value pill / n/a */}
      <div className="relative h-5">
        {thresholds.map(
          (t, i) =>
            i % 2 === 1 && (
              <span
                key={`top-${i}`}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] leading-5 text-slate-400"
                style={labelStyle(t.value)}
              >
                {t.label}
              </span>
            ),
        )}
        {hasValue ? (
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-700 px-1.5 py-px text-[10px] font-semibold leading-4 text-white"
            style={labelStyle(value as number)}
          >
            {formatValue(value as number, unit)}
          </span>
        ) : (
          <span className="absolute left-1/2 -translate-x-1/2 text-[10px] leading-5 text-slate-400">
            n/a
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-2.5 rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700">
        {zones.map((z, i) => (
          <div
            key={`zone-${i}`}
            className="absolute bottom-0 top-0 first:rounded-l-full last:rounded-r-full"
            style={{
              left: `${pct(z.from)}%`,
              width: `${Math.max(pct(z.to) - pct(z.from), 0)}%`,
              backgroundColor: z.color,
            }}
          />
        ))}
        {thresholds.map((t, i) => (
          <div
            key={`tick-${i}`}
            className="absolute -bottom-0.5 -top-0.5 w-px"
            style={{ left: `${pct(t.value)}%`, backgroundColor: t.color ?? tickFallback }}
          />
        ))}
        {hasValue &&
          (aboveMax || belowMin ? (
            <span
              className="absolute top-1/2 -translate-y-1/2 text-[9px] leading-none text-slate-700 dark:text-slate-200"
              style={aboveMax ? { right: 1 } : { left: 1 }}
              title={formatValue(value as number, unit)}
            >
              {aboveMax ? '▶' : '◀'}
            </span>
          ) : (
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-700 shadow dark:border-slate-900 dark:bg-slate-200"
              style={{ left: `${pct(value as number)}%` }}
            />
          ))}
      </div>

      {/* Bottom row: even-index threshold labels */}
      <div className="relative h-4">
        {thresholds.map(
          (t, i) =>
            i % 2 === 0 && (
              <span
                key={`bottom-${i}`}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] leading-4 text-slate-400"
                style={labelStyle(t.value)}
              >
                {t.label}
              </span>
            ),
        )}
      </div>
    </div>
  );
}
