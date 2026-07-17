import type { RegimeSnapshot } from '../../api/regimeApi';

/* ------------------------------------------------------------------ */
/* Download plumbing                                                   */
/* ------------------------------------------------------------------ */

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Serializes `data` as pretty-printed JSON and triggers a browser download. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(filename, blob);
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Escapes one CSV cell per RFC 4180: null/undefined become an empty cell;
 * values containing commas, double quotes, or line breaks are wrapped in
 * double quotes with inner quotes doubled.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Downloads `rows` as a CSV file. The header is the union of keys across all
 * rows in first-seen order, so columns stay stable even when some rows have
 * missing keys. A UTF-8 BOM is prepended so Excel opens the file correctly.
 */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  const lines = [
    columns.map(csvCell).join(','),
    ...rows.map((row) => columns.map((col) => csvCell(row[col])).join(',')),
  ];

  const blob = new Blob(['\ufeff' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  triggerDownload(filename, blob);
}

/* ------------------------------------------------------------------ */
/* Snapshot flattening                                                 */
/* ------------------------------------------------------------------ */

/**
 * Flattens a snapshot into one CSV-friendly row. Optional axis/global values
 * that are absent (e.g. pre-2003 degraded snapshots) become null, which
 * downloadCsv renders as an empty cell.
 */
export function snapshotToCsvRow(s: RegimeSnapshot): Record<string, unknown> {
  return {
    date: s.as_of_date,
    regime: s.regime.name,
    full_label: s.regime.full_label,
    growth_state: s.regime.growth_state,
    inflation_state: s.regime.inflation_state,
    financial_prefix: s.regime.financial_prefix,
    data_quality: s.data_quality,
    cfnai_3ma: s.raw_axes.cfnai_3ma,
    trimmed_pce_12m: s.raw_axes.trimmed_pce_12m,
    nfci: s.raw_axes.nfci,
    sahm: s.raw_axes.sahm,
    ten_two_spread: s.raw_axes.ten_two_spread,
    sos_indicator: s.raw_axes.sos_indicator ?? null,
    hy_oas: s.raw_axes.hy_oas ?? null,
    fed_funds: s.raw_axes.fed_funds ?? null,
    fwd_breakeven_5y5y: s.raw_axes.fwd_breakeven_5y5y ?? null,
    headline_cpi_yoy: s.raw_axes.headline_cpi_yoy ?? null,
    unemployment: s.raw_axes.unemployment ?? null,
    initial_claims: s.raw_axes.initial_claims ?? null,
    net_liquidity: s.raw_axes.net_liquidity ?? null,
    usCli: s.raw_global?.usCli ?? null,
    g7Cli: s.raw_global?.g7Cli ?? null,
    broadDollar: s.raw_global?.broadDollar ?? null,
    brentWti: s.raw_global?.brentWti ?? null,
    vix: s.raw_global?.vix ?? null,
  };
}
