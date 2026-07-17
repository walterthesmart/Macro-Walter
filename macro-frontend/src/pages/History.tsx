import React, { useState } from 'react';
import { useRegimeHistory } from '../hooks/useRegimeHistory';
import type { RegimeSnapshot } from '../api/regimeApi';
import { Spinner } from '../components/ui/Spinner';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { RegimeMatrix } from '../components/RegimeMatrix';
import { IndicatorGarden } from '../components/indicators/IndicatorGarden';
import { GlobalContextPanel } from '../components/global/GlobalContextPanel';

export function HistoryPage() {
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [regimeFilter, setRegimeFilter] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const { data, isLoading, error } = useRegimeHistory(page, limit, regimeFilter);

  // We need to fetch a large untruncated set just to get options for the dropdown,
  // but for simplicity, we'll extract from the current page data + hardcoded.
  // Ideally, this comes from a dedicated /regimes endpoint or we just hardcode the 7 main ones.
  const regimeOptions = [
    'Overheating',
    'Balanced Expansion',
    'Disinflationary Expansion',
    'Inflationary Pressure',
    'Transition / Mixed signals',
    'Stagflation',
    'Slowdown',
    'Disinflationary Contraction'
  ].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Regime History</h1>
          <p className="text-gray-600 dark:text-slate-300 mt-2">Browse the historical log of macro classifications.</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
          <label className="text-sm font-medium pl-2 dark:text-slate-300">Filter:</label>
          <select
            value={regimeFilter}
            onChange={(e) => { setRegimeFilter(e.target.value); setPage(0); }}
            className="border-none bg-gray-50 dark:bg-slate-800 rounded px-3 py-1.5 text-sm dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Regimes</option>
            {regimeOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {regimeFilter && (
            <button
              onClick={() => { setRegimeFilter(''); setPage(0); }}
              className="text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm pr-2 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : error || !data ? (
        <div className="p-12 text-center text-red-500 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-lg">Failed to load history data.</div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Regime Classification</th>
                    <th className="px-6 py-4 font-semibold text-center">Growth</th>
                    <th className="px-6 py-4 font-semibold text-center">Inflation</th>
                    <th className="px-6 py-4 font-semibold">Financial Conditions</th>
                    <th className="px-6 py-4 font-semibold text-center">Data Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-400">
                        No historical records found for this filter.
                      </td>
                    </tr>
                  ) : (
                    data.data.map((snapshot: RegimeSnapshot) => (
                      <React.Fragment key={snapshot.as_of_date}>
                        <tr 
                          className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          onClick={() => setExpandedDate(expandedDate === snapshot.as_of_date ? null : snapshot.as_of_date)}
                        >
                          <td className="px-6 py-4 font-mono text-gray-700 dark:text-slate-300 flex items-center gap-2">
                            {expandedDate === snapshot.as_of_date ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {snapshot.as_of_date}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900 dark:text-slate-100">{snapshot.regime.full_label}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-mono ${snapshot.regime.growth_state === 'G+' ? 'text-blue-600 dark:text-blue-400' : snapshot.regime.growth_state === 'G-' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              {snapshot.regime.growth_state}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-mono ${snapshot.regime.inflation_state === 'I+' ? 'text-red-600 dark:text-red-400' : snapshot.regime.inflation_state === 'I-' ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              {snapshot.regime.inflation_state}
                            </span>
                          </td>
                          <td className="px-6 py-4 capitalize text-gray-700 dark:text-slate-300">{snapshot.regime.financial_prefix}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              snapshot.data_quality === 'full' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {snapshot.data_quality}
                            </span>
                          </td>
                        </tr>
                        {expandedDate === snapshot.as_of_date && (
                          <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800">
                            <td colSpan={6} className="px-6 py-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                  <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-slate-200">Regime Matrix</h3>
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                                    <RegimeMatrix 
                                      growthState={snapshot.regime.growth_state} 
                                      inflationState={snapshot.regime.inflation_state} 
                                    />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-slate-200">Underlying Indicators</h3>
                                  <IndicatorGarden snapshot={snapshot} series={data.data} />
                                </div>
                              </div>
                              {snapshot.raw_global && (
                                <div className="mt-8">
                                  <GlobalContextPanel snapshot={snapshot} series={data.data} />
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-slate-300">
              Showing <span className="font-medium text-gray-900 dark:text-slate-100">{data.pagination.offset + 1}</span> to <span className="font-medium text-gray-900 dark:text-slate-100">{Math.min(data.pagination.offset + limit, data.pagination.total)}</span> of <span className="font-medium text-gray-900 dark:text-slate-100">{data.pagination.total}</span> results
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-md dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={data.pagination.offset + limit >= data.pagination.total}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-md dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
