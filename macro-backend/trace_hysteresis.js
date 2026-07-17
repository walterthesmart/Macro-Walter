const { Client } = require('pg');

async function main() {
  const c = new Client(process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/regime_db');
  await c.connect();
  const r = await c.query(`
    SELECT date,
           "growthState" AS g,
           "inflationState" AS i,
           (raw_axes->>'sahm')::float AS sahm,
           (raw_axes->>'trimmed_pce_12m')::float AS tpce,
           (raw_axes->>'cfnai_3ma')::float AS cfnai,
           hysteresis_state AS h
    FROM regime_snapshots
    WHERE date BETWEEN '2006-10-01' AND '2008-06-01'
    ORDER BY date
  `);
  for (const row of r.rows) {
    const d = row.date.toISOString().slice(0, 10);
    console.log(
      d,
      `G:${row.g} I:${row.i}`,
      `sahm=${row.sahm}`,
      `tpce=${row.tpce}`,
      `cfnai=${row.cfnai}`,
      `pendingG=${row.h?.pendingG ?? null} pendingI=${row.h?.pendingI ?? null} since=${row.h?.pendingSince ?? null}`
    );
  }
  await c.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
