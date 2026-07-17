// Zero-dependency diagnostic function — does NOT boot the Nest app.
// Tells us instantly whether env vars are present in the deployment.
// Mapped to GET /api/health (real files take precedence over the catch-all rewrite).
export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    runtime: process.version,
    env: {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      FRED_API_KEY_set: !!process.env.FRED_API_KEY,
      CRON_SECRET_set: !!process.env.CRON_SECRET,
      NODE_ENV: process.env.NODE_ENV || null,
    },
    db_url_host_hint: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] ?? 'unparseable'
      : null,
  });
}
