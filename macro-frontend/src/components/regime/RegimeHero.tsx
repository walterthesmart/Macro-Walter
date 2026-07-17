import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import type { RegimeSnapshot } from '../../api/regimeApi';
import { Badge } from '../ui/Badge';
import {
  getFinancialPrefixText,
  getRegimeMeta,
  growthStateLabel,
  hysteresisStatus,
  inflationStateLabel,
} from '../../lib/regimeMeta';

export interface RegimeHeroProps {
  snapshot: RegimeSnapshot;
  /** Episode stats from computeRegimeEpisodes, or null when the series is unavailable. */
  episodes: { currentMonths: number; medianMonths: number } | null;
}

function formatMonths(m: number): string {
  return Number.isInteger(m) ? String(m) : m.toFixed(1);
}

/**
 * The unmissable verdict card: regime name, axis-state chips, episode stats,
 * data-quality / revision / thresholds-version trust marks, and any pending
 * hysteresis warning.
 */
export function RegimeHero({ snapshot, episodes }: RegimeHeroProps) {
  const meta = getRegimeMeta(snapshot.regime.name);
  const { regime } = snapshot;
  const hStatus = hysteresisStatus(snapshot);

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{ borderLeftColor: meta.hex }}
    >
      {/* Soft tinted header band */}
      <div className={`px-6 py-6 md:px-8 md:py-7 ${meta.softClasses}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: meta.hex }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest">Current regime</span>
          <span className="text-xs opacity-75">as of {snapshot.as_of_date}</span>
          {snapshot.revised && (
            <span
              className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              title="Re-classified after source data revisions"
            >
              Revised
            </span>
          )}
        </div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
          {regime.name}
        </h1>
        <p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-300 md:text-lg">{regime.full_label}</p>
      </div>

      {/* Body */}
      <div className="px-6 py-6 md:px-8">
        {/* Axis-state chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={regime.growth_state}>
            Growth · {growthStateLabel(regime.growth_state)}
          </Badge>
          <Badge variant={regime.inflation_state}>
            Inflation · {inflationStateLabel(regime.inflation_state)}
          </Badge>
          <Badge variant="neutral">Financial · {regime.financial_prefix}</Badge>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {getFinancialPrefixText(regime.financial_prefix)}
        </p>

        {/* Stats + trust marks */}
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <CalendarDays size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
            {episodes ? (
              <span className="text-sm">
                In this regime for{' '}
                <span className="align-baseline text-xl font-bold text-slate-900 dark:text-slate-100">
                  {formatMonths(episodes.currentMonths)}
                </span>{' '}
                months{' '}
                <span className="text-slate-400 dark:text-slate-500">
                  · median episode: {formatMonths(episodes.medianMonths)} months
                </span>
              </span>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">Episode statistics unavailable</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {snapshot.data_quality === 'full' ? (
              <Badge variant="success">Data: Full</Badge>
            ) : (
              <Badge variant="warning">Data: Degraded (pre-2003 reduced set)</Badge>
            )}
            <Link
              to="/methodology"
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              title="How regimes are classified"
            >
              Thresholds v{snapshot.version}
            </Link>
          </div>
        </div>

        {/* Pending hysteresis warning */}
        {hStatus && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
            <span aria-hidden="true">⚠</span>
            <span>{hStatus.text}</span>
          </div>
        )}
      </div>
    </section>
  );
}
