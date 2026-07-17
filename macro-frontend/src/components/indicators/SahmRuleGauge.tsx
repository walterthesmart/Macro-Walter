import { Sparkline, type SparklinePoint } from '../ui/Sparkline';
import { ThresholdGauge } from '../ui/ThresholdGauge';

export interface SahmRuleGaugeProps {
  value: number | null;
  /** Recession trigger, from snapshot.thresholds.sahm.recession (typically 0.50). */
  threshold: number;
  /** Ascending by date; ~24 points works best. */
  spark?: SparklinePoint[];
}

/** Proximity band below the trigger that counts as "approaching". */
const APPROACH_BAND = 0.15;

/**
 * Dedicated recession-alert card for the Sahm rule. The gauge runs 0→1 with a
 * hard red trigger line and a red zone above it. Triggering the Sahm rule
 * forces the growth axis to G- immediately, bypassing the two-month
 * hysteresis confirmation.
 */
export function SahmRuleGauge({ value, threshold, spark }: SahmRuleGaugeProps) {
  const hasValue = value != null && Number.isFinite(value);
  const v = hasValue ? (value as number) : null;

  const state: 'alert' | 'approaching' | 'neutral' | 'na' =
    v == null
      ? 'na'
      : v >= threshold
        ? 'alert'
        : v >= threshold - APPROACH_BAND
          ? 'approaching'
          : 'neutral';

  const chipClasses: Record<typeof state, string> = {
    alert: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
    approaching: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    na: 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-500 dark:border-slate-700',
  };

  const chipText: Record<typeof state, string> = {
    alert: 'RECESSION ALERT',
    approaching: 'approaching trigger',
    neutral: 'below trigger',
    na: 'no data',
  };

  const stateCopy: Partial<Record<typeof state, string>> = {
    alert: 'Sahm rule triggered — growth axis forced to G- immediately (bypasses hysteresis)',
    approaching: `Within ${APPROACH_BAND.toFixed(2)} of the recession trigger — watch closely`,
    neutral: '3-month average unemployment comfortably below its 12-month low + trigger',
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: state === 'alert' ? '#dc2626' : state === 'approaching' ? '#d97706' : '#64748b' }}
          aria-hidden
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Sahm Rule
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        {v != null ? (
          <span
            className={`text-2xl font-bold ${
              state === 'alert'
                ? 'text-red-700 dark:text-red-300'
                : state === 'approaching'
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {v.toFixed(2)}
          </span>
        ) : (
          <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">n/a</span>
        )}
      </div>

      {spark && spark.length > 1 && (
        <Sparkline
          data={spark}
          stroke={state === 'alert' ? '#dc2626' : state === 'approaching' ? '#d97706' : '#64748b'}
          height={40}
          referenceLines={[threshold]}
        />
      )}

      <ThresholdGauge
        value={v}
        min={0}
        max={1}
        thresholds={[
          {
            value: threshold,
            label: `recession trigger ${threshold.toFixed(2)}`,
            color: '#dc2626',
          },
        ]}
        zones={[{ from: threshold, to: 1, color: '#fee2e2' }]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipClasses[state]}`}
        >
          {chipText[state]}
        </span>
      </div>

      {stateCopy[state] && (
        <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">{stateCopy[state]}</p>
      )}
    </div>
  );
}
