# Plan — Macro Regime Dashboard Upgrade

Implement the dashboard review: hero regime card, distance-to-threshold gauges, sparklines,
hysteresis status, regime history ribbon, matrix trail, new indicators (HY OAS, Fed Funds,
5Y5Y, headline CPI, unemployment, initial claims, net liquidity, SOS best-effort),
trust/freshness/export features, UX polish, section reorder.

## Architecture
- `macro-backend/`: NestJS + TypeORM (Postgres on localhost:5432, `synchronize: true`), FRED client. Seed: `npm run seed`. Build: `npm run build`.
- `macro-frontend/`: React 19 + Vite + Tailwind v4 + recharts + @tanstack/react-query + lucide-react. Build: `npm run build`. Dev server already running on :5173 (do not kill).
- Methodology reference: `pdf_text.txt` (threshold table lines ~300–360).

## API Contract v2 (backend implements EXACTLY this; frontend codes against it)
Every snapshot response (`/api/v1/regime/current`, `/classify`, `/history` items) gains:
```jsonc
{
  "version": "1.0.0",
  "as_of_date": "2026-07-01",
  "data_quality": "full",            // "degraded" pre-2003
  "revised": false,                  // NEW: updatedAt - createdAt > 1h
  "regime": { "name", "growth_state", "inflation_state", "financial_prefix", "full_label" },
  "hysteresis": { "lastConfirmedG": "G=", "lastConfirmedI": "I-",
                  "pendingG": null, "pendingI": null, "pendingSince": null },   // NEW (nullable)
  "thresholds": { "cfnai": {"g_plus": 0.2, "g_minus": -0.2},
                  "trimmedPce": {"target": 2.0, "band": 0.5},
                  "nfci": {"accommodating": -0.5, "restrictive": 0.0, "stress": 0.4},
                  "sahm": {"recession": 0.5}, "sos": {"early_recession": 0.2},
                  "spread": {"inversion": 0.0} },                                // NEW
  "global_context": { "synchronization", "dollar_channel", "commodity_channel",
                      "market_stress", "headline_underlying_divergence",
                      "us_g7_spread": 0.35 },                                    // spread NEW
  "raw_axes": { "cfnai_3ma": -0.03, "trimmed_pce_12m": 2.6, "nfci": -0.5,
                "sahm": 0.13, "ten_two_spread": 0.1,
                "sos_indicator": null, "hy_oas": 3.4, "fed_funds": 4.33,
                "fwd_breakeven_5y5y": 2.3, "headline_cpi_yoy": 2.7,
                "unemployment": 4.2, "initial_claims": 235000,
                "net_liquidity": 5900.0 },      // NEW optional/nullable fields
  "raw_global": { "usCli", "g7Cli", "broadDollar", "brentWti", "vix" },
  "series_dates": { "cfnai": "2026-06-01", "trimmed_pce": "2026-06-01" },        // NEW (nullable)
  "timestamp": "..."
}
```
New FRED series: T5YIFR, BAMLH0A0HYM2, FEDFUNDS, CPIAUCSL (YoY), UNRATE, ICSA,
WALCL−WTREGEN−RRPONTSYD = net_liquidity ($B). SOS: O'Trakoun & Scavette state-level
composite, best effort; threshold 0.20 (seed currently has wrong 0.6). MOVE/ISM PMI:
not on FRED — omitted (documented).

## Stages
- **Stage A (parallel)**:
  - A1 `Backend_Engineer` (coder): macro-backend changes above + reseed + verify endpoints.
  - A2 `Frontend_Core` (coder): api types, hooks, lib/regimeMeta, ui/Sparkline, ui/ThresholdGauge, Badge variants.
- **Stage B (parallel swarm, 5 coders; only own listed files)**:
  - B1 Hero: `components/regime/RegimeHero.tsx`, `components/regime/HowWeGotHere.tsx`
  - B2 Indicators: `components/indicators/{IndicatorGarden,IndicatorCard,SahmRuleGauge}.tsx`
  - B3 History: `components/regime/RegimeHistoryRibbon.tsx` + edit `components/RegimeMatrix.tsx` (trail prop)
  - B4 Global: `components/global/GlobalContextPanel.tsx`
  - B5 Trust: `components/trust/{TrustFooter,exportUtils}.tsx`, `components/regime/RegimeMeaning.tsx`
- **Stage C**: `Integrator` (coder): rewrite `pages/Home.tsx` (section order: Hero → HowWeGotHere → Matrix → Indicator garden → Global → History ribbon → Trust footer), date-picker as secondary toggle, nav cleanup, delete dead files, `npm run build` + `npm run lint` green.

## Home.tsx section contract (props)
- `<RegimeHero snapshot episodes={computeRegimeEpisodes(series)} />`
- `<HowWeGotHere snapshot />`
- `<RegimeMatrix growthState inflationState trail={last12 [{growth_state,inflation_state}]} />`
- `<IndicatorGarden snapshot series={last24} />`
- `<GlobalContextPanel snapshot series={last24} />`
- `<RegimeHistoryRibbon series={all} onSelect={(date)=>...} />`
- `<RegimeMeaning snapshot />` and `<TrustFooter snapshot series={all} />`
