

const sections = [
  {
    id: 'what-it-computes',
    title: 'WHAT IT COMPUTES',
    content: `
      <p>For any given month, the classification answers: what macro regime is the US economy in, based only on public data and a verifiable rule?</p>
      <p class="font-mono text-sm bg-muted dark:bg-slate-800/60 p-4 rounded-md my-4 text-primary dark:text-slate-200">"US Regime: [name] [+ financial conditions qualifier] — Global context: [synchronized / divergent], [dollar / commodities / stress qualifier]"</p>
      <p>Every term is verifiable: the regime name follows from the growth × inflation grid, the financial conditions qualifier from the Chicago Fed's NFCI, the global context from OECD CLIs and the ECB's CISS.</p>
    `,
  },
  {
    id: 'architecture',
    title: 'ARCHITECTURE',
    content: `
      <ul class="list-disc pl-6 space-y-2 mt-2">
        <li><strong>Core Layer (US Growth × Inflation):</strong> Defines the base regime. Uses CFNAI (3-month average) for growth and Dallas Fed Trimmed Mean PCE (12-month) for inflation.</li>
        <li><strong>Multiplier Layer (US Financial Conditions):</strong> Applies an adjective (e.g., "Restrictive", "Accommodative") based on the Chicago Fed NFCI.</li>
        <li><strong>Context Layer (Global View):</strong> Adds global nuance using OECD Composite Leading Indicators and the ECB Composite Indicator of Systemic Stress (CISS).</li>
      </ul>
    `
  },
  {
    id: 'seven-regimes',
    title: 'THE SEVEN REGIMES',
    content: `
      <p>The core classification maps the G × I combination to a specific regime name:</p>
      <div class="overflow-x-auto mt-4">
        <table class="min-w-full text-sm border-collapse border border-border dark:border-slate-700">
          <thead>
            <tr class="bg-muted dark:bg-slate-800/60">
              <th class="border border-border dark:border-slate-700 p-2">Regime Name</th>
              <th class="border border-border dark:border-slate-700 p-2">G State</th>
              <th class="border border-border dark:border-slate-700 p-2">I State</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Overheating</td><td class="border border-border dark:border-slate-700 p-2">G+</td><td class="border border-border dark:border-slate-700 p-2">I+</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Balanced Expansion</td><td class="border border-border dark:border-slate-700 p-2">G+</td><td class="border border-border dark:border-slate-700 p-2">I=</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Disinflationary Expansion</td><td class="border border-border dark:border-slate-700 p-2">G+</td><td class="border border-border dark:border-slate-700 p-2">I-</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Inflationary Pressure</td><td class="border border-border dark:border-slate-700 p-2">G=</td><td class="border border-border dark:border-slate-700 p-2">I+</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Transition</td><td class="border border-border dark:border-slate-700 p-2">G=</td><td class="border border-border dark:border-slate-700 p-2">I= or I-</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Stagflation</td><td class="border border-border dark:border-slate-700 p-2">G-</td><td class="border border-border dark:border-slate-700 p-2">I+</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Slowdown</td><td class="border border-border dark:border-slate-700 p-2">G-</td><td class="border border-border dark:border-slate-700 p-2">I=</td></tr>
            <tr><td class="border border-border dark:border-slate-700 p-2 font-medium">Disinflationary Contraction</td><td class="border border-border dark:border-slate-700 p-2">G-</td><td class="border border-border dark:border-slate-700 p-2">I-</td></tr>
          </tbody>
        </table>
      </div>
    `
  }
];

export function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-heading dark:text-slate-100 mb-4 tracking-tight">Methodology & Source Data</h1>
        <p className="text-text/70 dark:text-slate-300 text-lg max-w-2xl mx-auto">
          This page details the design, data sources, classification logic, and limitations of the Macro Regime Classification.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <details key={section.id} className="group bg-surface dark:bg-slate-900 rounded-xl shadow-sm border border-border dark:border-slate-800 overflow-hidden" open={section.id === 'what-it-computes'}>
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/30 dark:hover:bg-slate-800/60 transition-colors select-none">
              <h2 className="text-xl font-bold text-heading dark:text-slate-100 tracking-tight">{section.title}</h2>
              <span className="text-primary dark:text-slate-300 group-open:rotate-180 transition-transform duration-300 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 dark:bg-slate-800">▼</span>
            </summary>
            <div
              className="p-6 pt-0 text-text/80 dark:text-slate-300 prose prose-sm max-w-none prose-p:leading-relaxed dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </details>
        ))}
      </div>

      <div className="mt-12 p-8 bg-muted/50 dark:bg-slate-800/60 rounded-xl border border-border dark:border-slate-800 text-sm text-text/70 dark:text-slate-300">
        <p className="font-bold text-heading dark:text-slate-100 text-base mb-2 uppercase tracking-wider">Suggested Citation</p>
        <p className="italic bg-surface dark:bg-slate-900 p-4 rounded-lg border border-border/50 dark:border-slate-700">
          "Macro Regime Classification, based on the Chicago Fed NFCI, CFNAI, and Dallas Fed Trimmed Mean PCE. Threshold table v1.0.0."
        </p>
      </div>
    </div>
  );
}
