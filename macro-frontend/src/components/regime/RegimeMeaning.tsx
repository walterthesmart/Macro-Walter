import type { RegimeSnapshot } from '../../api/regimeApi';
import { getFinancialPrefixText, getRegimeMeta } from '../../lib/regimeMeta';

export interface RegimeMeaningProps {
  snapshot: RegimeSnapshot;
}

/**
 * 'What this regime typically means' — the two-sentence description of the
 * current regime, one sentence on the financial-conditions overlay, and the
 * closest historical analogue.
 */
export function RegimeMeaning({ snapshot }: RegimeMeaningProps) {
  const meta = getRegimeMeta(snapshot.regime.name);
  const prefixText = getFinancialPrefixText(snapshot.regime.financial_prefix);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        What this regime typically means
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{meta.description}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{prefixText}</p>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Historical analogues: <span className="font-medium text-slate-600 dark:text-slate-300">{meta.analog}</span>
      </p>
    </section>
  );
}
