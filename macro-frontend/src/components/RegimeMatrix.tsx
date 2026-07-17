import React from 'react';
import type { GrowthState, InflationState } from '../api/regimeApi';
import { getRegimeMeta } from '../lib/regimeMeta';
import { useTheme } from '../context/ThemeContext';

export interface RegimeTrailPoint {
  growth_state: GrowthState;
  inflation_state: InflationState;
}

interface RegimeMatrixProps {
  growthState: GrowthState;
  inflationState: InflationState;
  /**
   * Most-recent-first movement trail (up to 12 monthly states). May lead with
   * the current month, which is deduped from the active cell visually.
   */
  trail?: RegimeTrailPoint[];
}

const REGIME_GRID = [
  [
    { g: 'G+', i: 'I-', label: 'Disinflationary Expansion' },
    { g: 'G+', i: 'I=', label: 'Balanced Expansion' },
    { g: 'G+', i: 'I+', label: 'Overheating' },
  ],
  [
    { g: 'G=', i: 'I-', label: 'Transition' },
    { g: 'G=', i: 'I=', label: 'Transition' },
    { g: 'G=', i: 'I+', label: 'Inflationary Pressure' },
  ],
  [
    { g: 'G-', i: 'I-', label: 'Disinflationary Contraction' },
    { g: 'G-', i: 'I=', label: 'Slowdown' },
    { g: 'G-', i: 'I+', label: 'Stagflation' },
  ]
];

export const RegimeMatrix: React.FC<RegimeMatrixProps> = ({ growthState, inflationState, trail }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Drop the leading entry when it merely restates the current month — the
  // active cell already shows the 'Current' pill.
  const dedupesCurrent =
    !!trail &&
    trail.length > 0 &&
    trail[0].growth_state === growthState &&
    trail[0].inflation_state === inflationState;
  const points = (trail ?? []).slice(dedupesCurrent ? 1 : 0).slice(0, 12);
  const recencyOffset = dedupesCurrent ? 1 : 0;

  // Newest trail point 0.9 → oldest 0.25.
  const opacityFor = (idx: number) =>
    points.length <= 1 ? 0.9 : 0.9 - (idx / (points.length - 1)) * 0.65;

  const titleFor = (p: RegimeTrailPoint, idx: number) => {
    const ago = idx + recencyOffset;
    const when = ago === 0 ? 'This month' : ago === 1 ? '1 mo ago' : `${ago} mo ago`;
    return `${when} — ${p.growth_state}/${p.inflation_state}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[600px] border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header Row (Inflation) */}
        <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200 dark:bg-slate-800/60 dark:border-slate-800">
          <div className="p-4 flex items-center justify-center font-semibold text-gray-400 dark:text-slate-500 text-xs tracking-widest uppercase">
            Growth \ Inflation
          </div>
          <div className="p-4 flex items-center justify-center font-bold text-gray-700 border-l border-gray-200 dark:text-slate-300 dark:border-slate-800">
            I- (Disinflation)
          </div>
          <div className="p-4 flex items-center justify-center font-bold text-gray-700 border-l border-gray-200 dark:text-slate-300 dark:border-slate-800">
            I= (Stable)
          </div>
          <div className="p-4 flex items-center justify-center font-bold text-gray-700 border-l border-gray-200 dark:text-slate-300 dark:border-slate-800">
            I+ (Acceleration)
          </div>
        </div>

        {/* Data Rows (Growth) */}
        {REGIME_GRID.map((row, rowIndex) => {
          const rowLabels = ['G+ (Above Trend)', 'G= (On Trend)', 'G- (Contracting)'];
          
          return (
            <div key={rowIndex} className="grid grid-cols-4 border-b border-gray-100 last:border-b-0 dark:border-slate-800">
              
              {/* Growth Row Header */}
              <div className="p-4 flex items-center justify-center font-bold text-gray-700 bg-gray-50 dark:bg-slate-800/60 dark:text-slate-300">
                {rowLabels[rowIndex]}
              </div>

              {/* Grid Cells */}
              {row.map((cell, colIndex) => {
                const isActive = cell.g === growthState && cell.i === inflationState;
                const meta = getRegimeMeta(cell.label);
                const cellPoints = points
                  .map((p, idx) => ({ p, idx }))
                  .filter(({ p }) => p.growth_state === cell.g && p.inflation_state === cell.i);

                return (
                  <div
                    key={colIndex}
                    className={`
                      relative p-6 flex flex-col items-center justify-center transition-all duration-300
                      ${isActive
                        ? 'z-10 font-semibold shadow-sm'
                        : 'border-l border-gray-100 bg-white text-gray-500 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60'
                      }
                    `}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${meta.hex}1a`,
                            border: `2px solid ${meta.hex}`,
                            color: isDark ? '#f1f5f9' : '#1e293b',
                          }
                        : undefined
                    }
                  >
                    <span className="text-center">{cell.label}</span>
                    {isActive && (
                      <span
                        className="mt-2 text-xs px-2 py-0.5 rounded-full border bg-white/80 dark:bg-slate-900/70"
                        style={{ borderColor: meta.hex, color: isDark ? '#e2e8f0' : '#334155' }}
                      >
                        Current
                      </span>
                    )}
                    {/* Movement-trail dots, stacked diagonally when a cell repeats */}
                    {cellPoints.map(({ p, idx }, stackIdx) => (
                      <span
                        key={idx}
                        title={titleFor(p, idx)}
                        className="absolute w-2.5 h-2.5 rounded-full ring-1 ring-white dark:ring-slate-900"
                        style={{
                          left: 8 + stackIdx * 6,
                          bottom: 8 + stackIdx * 6,
                          backgroundColor: meta.hex,
                          opacity: opacityFor(idx),
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
