import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { RegimeSnapshot } from '../../api/regimeApi';
import { getFinancialPrefixText, inflationStateLabel } from '../../lib/regimeMeta';

export interface HowWeGotHereProps {
  snapshot: RegimeSnapshot;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** 'just' near a threshold, 'well' far past it, nothing in between. */
function qualifier(dist: number): string {
  if (dist < 0.1) return 'just ';
  if (dist >= 0.4) return 'well ';
  return '';
}

/* ------------------------------------------------------------------ */
/* Sentence builders                                                   */
/* ------------------------------------------------------------------ */

function growthSentence(s: RegimeSnapshot): string {
  const v = s.raw_axes.cfnai_3ma;
  const sahm = s.raw_axes.sahm;
  const sahmLine = s.thresholds.sahm.recession;

  // The Sahm Rule is a hard gate and overrides the CFNAI read when triggered.
  if (isNum(sahm) && sahm >= sahmLine) {
    return `The Sahm Rule has triggered its hard recession gate: at ${sahm.toFixed(2)} it sits above the ${sahmLine.toFixed(2)} threshold, overriding the growth signal from the CFNAI 3-month average (${isNum(v) ? v.toFixed(2) : 'n/a'}).`;
  }

  if (!isNum(v)) {
    return 'Growth momentum cannot be read for this snapshot because the CFNAI 3-month average is unavailable.';
  }

  const { g_plus, g_minus } = s.thresholds.cfnai;
  const fmt = (x: number) => x.toFixed(2);

  if (v >= g_plus) {
    const d = v - g_plus;
    return `Growth is running ${qualifier(d)}above the G+ threshold: the CFNAI 3-month average is ${fmt(v)}, ${fmt(d)} above the ${fmt(g_plus)} line.`;
  }
  if (v <= g_minus) {
    const d = g_minus - v;
    return `Growth sits ${qualifier(d)}below the G- threshold: the CFNAI 3-month average is ${fmt(v)}, ${fmt(d)} below the ${fmt(g_minus)} line.`;
  }
  // Inside the band: report distance to the nearer threshold.
  const dPlus = g_plus - v;
  const dMinus = v - g_minus;
  if (dMinus <= dPlus) {
    return `Growth sits ${qualifier(dMinus)}above the G- threshold: the CFNAI 3-month average is ${fmt(v)}, ${fmt(dMinus)} above the ${fmt(g_minus)} line.`;
  }
  return `Growth sits ${qualifier(dPlus)}below the G+ threshold: the CFNAI 3-month average is ${fmt(v)}, ${fmt(dPlus)} below the ${fmt(g_plus)} line.`;
}

function inflationSentence(s: RegimeSnapshot): string {
  const v = s.raw_axes.trimmed_pce_12m;
  const { target, band } = s.thresholds.trimmedPce;

  if (!isNum(v)) {
    return 'Inflation momentum cannot be read for this snapshot because trimmed mean PCE is unavailable.';
  }

  const state = s.regime.inflation_state;
  const pending = s.hysteresis?.pendingI ?? null;
  const dir =
    state === 'I+'
      ? 'and still accelerating'
      : state === 'I-'
        ? 'and decelerating'
        : 'and holding steady';
  const shift =
    pending && pending !== state
      ? `, with a shift toward ${inflationStateLabel(pending).toLowerCase()} awaiting confirmation`
      : '';

  const diff = v - target;
  if (Math.abs(diff) <= band) {
    return `Inflation is close to target: trimmed mean PCE is running at ${v.toFixed(1)}%, inside the ±${band.toFixed(1)}pp band around the ${target.toFixed(1)}% goal ${dir}${shift}.`;
  }
  const side = diff > 0 ? 'above' : 'below';
  return `Inflation is running ${Math.abs(diff).toFixed(1)}pp ${side} target: trimmed mean PCE is ${v.toFixed(1)}% versus the ${target.toFixed(1)}% goal ${dir}${shift}.`;
}

function conditionsSentence(s: RegimeSnapshot): string {
  const nfci = s.raw_axes.nfci;
  const ctx = s.global_context;
  const g = s.raw_global;

  // Reuse the shared prefix sentence (minus the trailing period) as the clause.
  let meaning = getFinancialPrefixText(s.regime.financial_prefix).replace(/\.$/, '');
  meaning = meaning.charAt(0).toUpperCase() + meaning.slice(1);

  const nfciText = isNum(nfci) ? `, with the NFCI at ${nfci.toFixed(2)}` : '';

  // One notable global item, in priority order.
  let globalClause: string;
  if (ctx.market_stress === 'elevated' || ctx.market_stress === 'high') {
    globalClause = `global market stress is ${ctx.market_stress}${g && isNum(g.vix) ? ` (VIX ${g.vix.toFixed(1)})` : ''}`;
  } else if (ctx.dollar_channel && ctx.dollar_channel !== 'neutral') {
    globalClause = `the dollar channel is ${ctx.dollar_channel}${g && isNum(g.broadDollar) ? ` (broad dollar ${g.broadDollar.toFixed(1)})` : ''}`;
  } else if (ctx.commodity_channel === 'spike') {
    globalClause = `a commodity spike is feeding inflation risk${g && isNum(g.brentWti) ? ` (Brent $${g.brentWti.toFixed(2)})` : ''}`;
  } else {
    globalClause = `global growth is ${ctx.synchronization || 'unsynchronized'}${isNum(ctx.us_g7_spread) ? ` (US–G7 CLI spread ${ctx.us_g7_spread.toFixed(2)})` : ''}`;
  }

  return `${meaning}${nfciText}; ${globalClause}.`;
}

/* ------------------------------------------------------------------ */
/* Key-driver chips                                                    */
/* ------------------------------------------------------------------ */

interface DriverChip {
  key: string;
  label: string;
  hint: string;
  score: number;
}

/** Scores each core axis by threshold proximity (beyond-threshold wins) and keeps the top 4. */
function driverChips(s: RegimeSnapshot): DriverChip[] {
  const t = s.thresholds;
  const chips: DriverChip[] = [];

  const cfnai = s.raw_axes.cfnai_3ma;
  if (isNum(cfnai)) {
    const dist = Math.min(Math.abs(cfnai - t.cfnai.g_plus), Math.abs(cfnai - t.cfnai.g_minus));
    const beyond = cfnai >= t.cfnai.g_plus || cfnai <= t.cfnai.g_minus;
    chips.push({
      key: 'cfnai',
      label: `CFNAI ${cfnai.toFixed(2)}`,
      hint: `${dist.toFixed(2)} from the nearest growth threshold (${t.cfnai.g_minus.toFixed(2)} / +${t.cfnai.g_plus.toFixed(2)})`,
      score: (beyond ? 2 : 0) + 1 / (1 + dist / 0.2),
    });
  }

  const pce = s.raw_axes.trimmed_pce_12m;
  if (isNum(pce)) {
    const gap = Math.abs(pce - t.trimmedPce.target);
    const edgeDist = Math.abs(gap - t.trimmedPce.band);
    chips.push({
      key: 'trimmed_pce',
      label: `Trimmed PCE ${pce.toFixed(1)}%`,
      hint:
        gap > t.trimmedPce.band
          ? `${(gap - t.trimmedPce.band).toFixed(1)}pp outside the ±${t.trimmedPce.band.toFixed(1)}pp target band`
          : `${edgeDist.toFixed(1)}pp inside the edge of the ±${t.trimmedPce.band.toFixed(1)}pp target band`,
      score: (gap > t.trimmedPce.band ? 2 : 0) + 1 / (1 + edgeDist / 0.25),
    });
  }

  const nfci = s.raw_axes.nfci;
  if (isNum(nfci)) {
    const dist = Math.min(
      Math.abs(nfci - t.nfci.accommodating),
      Math.abs(nfci - t.nfci.restrictive),
      Math.abs(nfci - t.nfci.stress),
    );
    const beyond = nfci >= t.nfci.stress || nfci <= t.nfci.accommodating;
    chips.push({
      key: 'nfci',
      label: `NFCI ${nfci.toFixed(2)}`,
      hint: `${dist.toFixed(2)} from the nearest financial-conditions threshold`,
      score: (beyond ? 2 : 0) + 1 / (1 + dist / 0.25),
    });
  }

  const sahm = s.raw_axes.sahm;
  if (isNum(sahm)) {
    const dist = Math.abs(sahm - t.sahm.recession);
    const beyond = sahm >= t.sahm.recession;
    chips.push({
      key: 'sahm',
      label: `Sahm ${sahm.toFixed(2)}`,
      hint: beyond
        ? `${dist.toFixed(2)} above the ${t.sahm.recession.toFixed(2)} recession threshold`
        : `${dist.toFixed(2)} below the ${t.sahm.recession.toFixed(2)} recession threshold`,
      score: (beyond ? 2 : 0) + 1 / (1 + dist / 0.25),
    });
  }

  return chips.sort((a, b) => b.score - a.score).slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Plain-language driver summary: exactly three sentences (growth, inflation,
 * financial conditions) derived from raw_axes vs thresholds, plus key-driver
 * chips and a headline-vs-underlying divergence note when flagged.
 */
export function HowWeGotHere({ snapshot }: HowWeGotHereProps) {
  const growthIcon =
    snapshot.regime.growth_state === 'G+' ? (
      <TrendingUp size={15} />
    ) : snapshot.regime.growth_state === 'G-' ? (
      <TrendingDown size={15} />
    ) : (
      <Minus size={15} />
    );
  const inflationIcon =
    snapshot.regime.inflation_state === 'I+' ? (
      <TrendingUp size={15} />
    ) : snapshot.regime.inflation_state === 'I-' ? (
      <TrendingDown size={15} />
    ) : (
      <Minus size={15} />
    );

  const sentences = [
    { key: 'growth', icon: growthIcon, text: growthSentence(snapshot) },
    { key: 'inflation', icon: inflationIcon, text: inflationSentence(snapshot) },
    { key: 'conditions', icon: <Activity size={15} />, text: conditionsSentence(snapshot) },
  ];

  const chips = driverChips(snapshot);

  const headlineCpi = snapshot.raw_axes.headline_cpi_yoy;
  const trimmedPce = snapshot.raw_axes.trimmed_pce_12m;
  let divergenceNote: string | null = null;
  if (
    snapshot.global_context.headline_underlying_divergence &&
    isNum(headlineCpi) &&
    isNum(trimmedPce)
  ) {
    divergenceNote = `Headline CPI (${headlineCpi.toFixed(1)}%) diverges from underlying trimmed PCE (${trimmedPce.toFixed(1)}%) — gap > 1pp, often energy-driven.`;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">How we got here</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The three forces behind this classification, in plain language.
      </p>

      <ul className="mt-5 space-y-3.5">
        {sentences.map((s) => (
          <li key={s.key} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {s.icon}
            </span>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">{s.text}</p>
          </li>
        ))}
      </ul>

      {chips.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {chips.map((c) => (
            <span
              key={c.key}
              title={c.hint}
              className="cursor-default rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {c.label}
            </span>
          ))}
        </div>
      )}

      {divergenceNote && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
          {divergenceNote}
        </p>
      )}
    </section>
  );
}
