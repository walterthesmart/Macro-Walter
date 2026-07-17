import React from 'react';
import { Sparkline, type SparklinePoint } from '../ui/Sparkline';
import {
  ThresholdGauge,
  type GaugeThreshold,
  type GaugeZone,
} from '../ui/ThresholdGauge';

export interface IndicatorCardGauge {
  min: number;
  max: number;
  thresholds: GaugeThreshold[];
  zones?: GaugeZone[];
}

export interface IndicatorCardProps {
  title: string;
  value: number | null;
  unit?: string;
  decimals?: number;
  /** Ascending by date; ~24 points works best. */
  spark?: SparklinePoint[];
  gauge?: IndicatorCardGauge;
  status?: React.ReactNode;
  note?: string;
  /** Accent for the sparkline stroke / title dot. Defaults to slate. */
  accentHex?: string;
}

function formatValue(value: number, decimals: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Reusable indicator card: uppercase title, large value, optional sparkline,
 * optional threshold gauge, optional status row, muted note.
 * Null values render 'n/a', keep the note as fallback context, and skip
 * gauge/spark rendering (e.g. pre-2003 degraded snapshots).
 */
export function IndicatorCard({
  title,
  value,
  unit,
  decimals = 2,
  spark,
  gauge,
  status,
  note,
  accentHex = '#64748b',
}: IndicatorCardProps) {
  const hasValue = value != null && Number.isFinite(value);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: accentHex }}
          aria-hidden
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        {hasValue ? (
          <>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {formatValue(value as number, decimals)}
            </span>
            {unit && <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{unit}</span>}
          </>
        ) : (
          <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">n/a</span>
        )}
      </div>

      {hasValue && spark && spark.length > 1 && (
        <Sparkline data={spark} stroke={accentHex} height={40} />
      )}

      {hasValue && gauge && (
        <ThresholdGauge
          value={value}
          min={gauge.min}
          max={gauge.max}
          thresholds={gauge.thresholds}
          zones={gauge.zones}
          unit={unit}
        />
      )}

      {status && <div className="flex flex-wrap items-center gap-2">{status}</div>}

      {note && <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">{note}</p>}
    </div>
  );
}
