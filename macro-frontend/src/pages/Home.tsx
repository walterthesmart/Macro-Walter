import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { useCurrentRegime } from '../hooks/useCurrentRegime';
import { useRegimeSeries } from '../hooks/useRegimeSeries';
import { computeRegimeEpisodes } from '../lib/regimeMeta';
import { RegimeHero } from '../components/regime/RegimeHero';
import { HowWeGotHere } from '../components/regime/HowWeGotHere';
import { RegimeMatrix } from '../components/RegimeMatrix';
import { IndicatorGarden } from '../components/indicators/IndicatorGarden';
import { GlobalContextPanel } from '../components/global/GlobalContextPanel';
import { RegimeMeaning } from '../components/regime/RegimeMeaning';
import { RegimeHistoryRibbon } from '../components/regime/RegimeHistoryRibbon';
import { TrustFooter } from '../components/trust/TrustFooter';

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const navigate = useNavigate();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      setSearchParams({ date: newDate });
    } else {
      navigate('/');
    }
  };

  const { data, isLoading, error } = useCurrentRegime(dateParam);
  const seriesQuery = useRegimeSeries(500);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-bold dark:text-slate-100">Loading Data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300 p-6 rounded-lg text-center shadow">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>Failed to load regime data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const snapshot = data;
  // Series arrives DESC (most recent first); degrade gracefully when unavailable.
  const allSeries = seriesQuery.data?.data ?? [];
  const last24 = allSeries.slice(0, 24);
  const episodes = allSeries.length > 0 ? computeRegimeEpisodes(allSeries) : null;
  const trail = allSeries.slice(0, 12).map((s) => ({
    growth_state: s.regime.growth_state,
    inflation_state: s.regime.inflation_state,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">Macro Regime Dashboard</h1>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          {showDatePicker || dateParam ? (
            <>
              <label htmlFor="date-picker" className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                Historical Date:
              </label>
              <input
                type="date"
                id="date-picker"
                value={dateParam || ''}
                onChange={handleDateChange}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:[color-scheme:dark]"
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            >
              <History size={15} />
              View historical…
            </button>
          )}
        </div>
      </div>

      {dateParam && (
        <div className="bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 p-4 rounded-lg mb-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span>
            Viewing historical snapshot from: <strong>{dateParam}</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-md border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            Back to current
          </button>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* a. Hero verdict card */}
        <RegimeHero snapshot={snapshot} episodes={episodes} />

        {/* b. Plain-language driver summary */}
        <HowWeGotHere snapshot={snapshot} />

        {/* c. Regime matrix with 12-month movement trail */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-slate-200 border-b dark:border-slate-800 pb-2">Regime Matrix</h2>
          <RegimeMatrix
            growthState={snapshot.regime.growth_state}
            inflationState={snapshot.regime.inflation_state}
            trail={trail}
          />
        </div>

        {/* d. Indicator garden (last 24 months of sparklines) */}
        <IndicatorGarden snapshot={snapshot} series={last24} />

        {/* e. Global context (only when global data exists) */}
        {snapshot.raw_global && <GlobalContextPanel snapshot={snapshot} series={last24} />}

        {/* f. What this regime typically means */}
        <RegimeMeaning snapshot={snapshot} />

        {/* g. Full history ribbon (hidden when the series is unavailable) */}
        {allSeries.length > 0 && (
          <RegimeHistoryRibbon
            series={allSeries}
            currentDate={snapshot.as_of_date}
            onSelect={(date) => setSearchParams({ date })}
          />
        )}

        {/* h. Trust footer: freshness, provenance, export */}
        <TrustFooter snapshot={snapshot} series={allSeries} />
      </div>
    </div>
  );
}
