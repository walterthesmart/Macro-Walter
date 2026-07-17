import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import type { RegimeSnapshot } from '../../api/regimeApi';
import { SERIES_FRESHNESS_META, type SeriesKey } from '../../lib/regimeMeta';
import { downloadCsv, downloadJson, snapshotToCsvRow } from './exportUtils';

export interface TrustFooterProps {
  snapshot: RegimeSnapshot;
  series: RegimeSnapshot[];
}

/** Most decision-relevant series, in display order (max 10). */
const FRESHNESS_ROWS: SeriesKey[] = [
  'cfnai',
  'trimmed_pce',
  'nfci',
  'sahm',
  'ten_two_spread',
  'us_cli',
  'g7_cli',
  'hy_oas',
  'cpi',
  'unemployment',
];

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Age of a series' last observation in weeks, measured against the snapshot's
 * as-of date (never the wall clock, so historical snapshots render correctly).
 */
function obsAgeWeeks(lastObs: string, asOf: string): number | null {
  const obs = Date.parse(lastObs);
  const end = Date.parse(asOf);
  if (!Number.isFinite(obs) || !Number.isFinite(end)) return null;
  return Math.max(0, (end - obs) / MS_PER_WEEK);
}

type FreshnessStatus = 'current' | 'lagging' | 'unknown';

const STATUS_DOT: Record<FreshnessStatus, string> = {
  current: 'bg-emerald-500',
  lagging: 'bg-amber-400',
  unknown: 'bg-slate-300',
};

function ColumnHeading({ children }: { children: string }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</h4>
  );
}

function StatusDot({ status }: { status: FreshnessStatus }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full align-middle ${STATUS_DOT[status]}`}
      title={status}
    />
  );
}

/**
 * Page footer with data-freshness status, snapshot provenance, and export
 * actions. Typography is deliberately compact and quiet.
 */
export function TrustFooter({ snapshot, series }: TrustFooterProps) {
  const seriesDates = snapshot.series_dates;

  const handleExportJson = () => {
    downloadJson(`regime-${snapshot.as_of_date}.json`, snapshot);
  };

  const handleExportCsv = () => {
    downloadCsv('regime-history.csv', series.map(snapshotToCsvRow));
  };

  return (
    <footer className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Data freshness */}
        <div>
          <ColumnHeading>Data freshness</ColumnHeading>
          {seriesDates ? (
            <>
              <ul className="mt-3 space-y-1.5">
                {FRESHNESS_ROWS.map((key) => {
                  const meta = SERIES_FRESHNESS_META[key];
                  const lastObs = seriesDates[key];
                  const ageWeeks = lastObs ? obsAgeWeeks(lastObs, snapshot.as_of_date) : null;
                  const status: FreshnessStatus =
                    ageWeeks === null
                      ? 'unknown'
                      : ageWeeks <= meta.expectedLagWeeks * 1.5
                        ? 'current'
                        : 'lagging';
                  return (
                    <li key={key} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-slate-600 dark:text-slate-300">{meta.label}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="tabular-nums text-slate-400">{lastObs ?? '—'}</span>
                        <StatusDot status={status} />
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <StatusDot status="current" /> current
                </span>
                <span className="flex items-center gap-1">
                  <StatusDot status="lagging" /> lagging
                </span>
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              Per-series freshness unavailable for this snapshot.
            </p>
          )}
        </div>

        {/* Provenance */}
        <div>
          <ColumnHeading>Provenance</ColumnHeading>
          <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                v{snapshot.version}
              </span>
              <Link
                to="/methodology"
                className="font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-700 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-200"
              >
                Methodology
              </Link>
            </div>
            <p>
              {snapshot.data_quality === 'full'
                ? 'Full indicator set'
                : 'Degraded — pre-2003 reduced set'}
            </p>
            {snapshot.revised ? (
              <p className="text-amber-600 dark:text-amber-400">This month was re-classified after source revisions</p>
            ) : (
              <p className="text-slate-400">No post-publication revisions</p>
            )}
            <p className="text-slate-400">as of {snapshot.as_of_date}</p>
          </div>
        </div>

        {/* Export */}
        <div>
          <ColumnHeading>Export</ColumnHeading>
          <div className="mt-3 flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Download size={13} strokeWidth={2} />
              Current snapshot (JSON)
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Download size={13} strokeWidth={2} />
              Full history (CSV)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
