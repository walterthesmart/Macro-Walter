import React, { useMemo, useState } from 'react';
import type { RegimeSnapshot } from '../../api/regimeApi';
import { REGIME_META, getRegimeMeta } from '../../lib/regimeMeta';
import { useTheme } from '../../context/ThemeContext';

export interface RegimeHistoryRibbonProps {
  /** Full monthly history, DESC by as_of_date (latest first), back to 2000. */
  series: RegimeSnapshot[];
  /** Optional as_of_date (YYYY-MM-DD) highlighted with a dark ring. */
  currentDate?: string;
  /** Called with the as_of_date of the clicked month segment. */
  onSelect?: (date: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FALLBACK_HEX = '#64748b';

interface EpisodeMarker {
  label: string;
  start: string;
  end: string;
}

/** Notable macro episodes, positioned proportionally from their date ranges. */
const EPISODE_MARKERS: EpisodeMarker[] = [
  { label: '2008–09 GFC', start: '2008-09-01', end: '2009-06-01' },
  { label: '2020 COVID', start: '2020-02-01', end: '2020-06-01' },
  { label: '2021 reflation', start: '2021-03-01', end: '2021-11-01' },
  { label: '2022 tightening', start: '2022-03-01', end: '2022-12-01' },
  { label: '2023–24 soft landing', start: '2023-06-01', end: '2024-12-01' },
];

const YEAR_TICKS = [2003, 2008, 2014, 2020, 2026];

/** Timezone-safe timestamp for a YYYY-MM-DD string. */
function toTs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y || 1970, (m || 1) - 1, d || 1);
}

/** 'Mon YYYY' from a YYYY-MM-DD string. */
function fmtMonth(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1] ?? ''} ${y || ''}`;
}

export const RegimeHistoryRibbon: React.FC<RegimeHistoryRibbonProps> = ({
  series,
  currentDate,
  onSelect,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { theme } = useTheme();
  const currentRingColor = theme === 'dark' ? '#f8fafc' : '#0f172a';

  // API delivers DESC; the ribbon renders oldest → newest, left → right.
  const months = useMemo(
    () => [...series].sort((a, b) => a.as_of_date.localeCompare(b.as_of_date)),
    [series],
  );

  const { minTs, maxTs } = useMemo(() => {
    if (months.length === 0) return { minTs: 0, maxTs: 0 };
    return {
      minTs: toTs(months[0].as_of_date),
      maxTs: toTs(months[months.length - 1].as_of_date),
    };
  }, [months]);

  const span = Math.max(maxTs - minTs, 1);
  const pct = (ts: number) => Math.min(100, Math.max(0, ((ts - minTs) / span) * 100));

  const minYear = months.length > 0 ? new Date(minTs).getUTCFullYear() : 0;
  const maxYear = months.length > 0 ? new Date(maxTs).getUTCFullYear() : 0;
  const yearTicks = YEAR_TICKS.filter((y) => y >= minYear && y <= maxYear);

  const markers = EPISODE_MARKERS.filter(
    (e) => months.length > 0 && toTs(e.end) >= minTs && toTs(e.start) <= maxTs,
  ).map((e) => ({ ...e, x: pct((toTs(e.start) + toTs(e.end)) / 2) }));

  if (months.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-200">Regime History</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">No regime history available.</p>
      </div>
    );
  }

  const hovered = hoveredIdx !== null ? months[hoveredIdx] : null;
  const tooltipLeft =
    hoveredIdx !== null
      ? Math.min(94, Math.max(6, ((hoveredIdx + 0.5) / months.length) * 100))
      : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Regime History</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {fmtMonth(months[0].as_of_date)} – {fmtMonth(months[months.length - 1].as_of_date)} ·{' '}
          {months.length} months
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[900px]">
          {/* Color strip: one slim segment per month, same-regime runs merge visually */}
          <div className="relative">
            {hovered && (
              <div
                className="absolute bottom-full mb-2 z-20 pointer-events-none"
                style={{ left: `${tooltipLeft}%`, transform: 'translateX(-50%)' }}
              >
                <div className="bg-slate-800 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap dark:bg-slate-100 dark:text-slate-900">
                  {fmtMonth(hovered.as_of_date)} — {hovered.regime.name} (
                  {hovered.regime.growth_state}/{hovered.regime.inflation_state})
                </div>
              </div>
            )}

            <div
              className="flex h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {months.map((snap, i) => {
                const meta = getRegimeMeta(snap.regime.name);
                const isCurrent = currentDate === snap.as_of_date;
                const label = `${fmtMonth(snap.as_of_date)} — ${snap.regime.name}`;
                return (
                  <div
                    key={snap.as_of_date}
                    role={onSelect ? 'button' : undefined}
                    aria-label={label}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onClick={() => onSelect?.(snap.as_of_date)}
                    className={`flex-1 h-full transition-[filter] duration-100 hover:brightness-110 ${
                      onSelect ? 'cursor-pointer' : ''
                    } ${snap.data_quality === 'degraded' ? 'opacity-40' : ''}`}
                    style={{
                      backgroundColor: meta.hex,
                      ...(isCurrent ? { boxShadow: `inset 0 0 0 2px ${currentRingColor}` } : {}),
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Sparse year ticks, aligned proportionally to the data range */}
          <div className="relative h-5 mt-1.5">
            {yearTicks.map((y) => (
              <div
                key={y}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${pct(toTs(`${y}-01-01`))}%`, transform: 'translateX(-50%)' }}
              >
                <span className="w-px h-1.5 bg-slate-300 dark:bg-slate-600" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{y}</span>
              </div>
            ))}
          </div>

          {/* Notable-episode markers, staggered on two rows to avoid label overlap */}
          <div className="relative h-10 mt-1">
            {markers.map((m, i) => (
              <div
                key={m.label}
                className="absolute flex flex-col items-center"
                style={{ left: `${m.x}%`, top: i % 2 === 0 ? 0 : 18, transform: 'translateX(-50%)' }}
              >
                <span className="w-1.5 h-1.5 rotate-45 bg-slate-400 dark:bg-slate-500" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Legend: one chip per regime + degraded-data note */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {Object.entries(REGIME_META).map(([name, meta]) => (
              <span key={name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.hex }}
                />
                {name}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 italic ml-auto">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 opacity-40"
                style={{ backgroundColor: FALLBACK_HEX }}
              />
              pre-2003: reduced indicator set
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
