// A private page with the QR scan counts: /qr-stats?key=<QR_STATS_KEY>.
// Set QR_STATS_KEY in Netlify → Site configuration → Environment variables.
// Without it the page stays switched off (404).

import { getDatabase } from '@netlify/database';
import { CODES } from './qr.mjs';

const LABELS = { pack: 'Packaging (repeat customers)', promo: 'General marketing' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export default async (req) => {
  const secret = process.env.QR_STATS_KEY;
  const key = new URL(req.url).searchParams.get('key');
  if (!secret || key !== secret) return new Response('Not found', { status: 404 });

  const db = getDatabase();
  const totals = await db.sql`
    SELECT code,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE scanned_at > NOW() - INTERVAL '7 days')::int AS week,
           COUNT(*) FILTER (WHERE scanned_at > NOW() - INTERVAL '30 days')::int AS month,
           MAX(scanned_at) AS last_scan
    FROM qr_scans GROUP BY code`;
  const months = await db.sql`
    SELECT code, TO_CHAR(DATE_TRUNC('month', scanned_at), 'YYYY-MM') AS month, COUNT(*)::int AS scans
    FROM qr_scans GROUP BY code, month ORDER BY month DESC, code`;

  const byCode = Object.fromEntries(totals.map((r) => [r.code, r]));
  const totalRows = Object.keys(CODES).map((code) => {
    const r = byCode[code] || { total: 0, week: 0, month: 0, last_scan: null };
    const last = r.last_scan ? new Date(r.last_scan).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '–';
    return `<tr><td>${esc(LABELS[code] || code)}<br><small>/q/${esc(code)}</small></td>` +
      `<td>${r.total}</td><td>${r.week}</td><td>${r.month}</td><td>${esc(last)}</td></tr>`;
  }).join('');
  const monthRows = months.map((r) =>
    `<tr><td>${esc(r.month)}</td><td>${esc(LABELS[r.code] || r.code)}</td><td>${r.scans}</td></tr>`
  ).join('') || '<tr><td colspan="3">No scans yet.</td></tr>';

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>QR scans · pirekua</title>
<style>
  body{font-family:Poppins,system-ui,sans-serif;background:#FFF8EC;color:#3A1406;margin:0;padding:32px 16px}
  main{max-width:760px;margin:0 auto}h1{color:#F48500}
  table{width:100%;border-collapse:collapse;background:#FFF1DA;border-radius:16px;overflow:hidden;margin-bottom:32px}
  th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #3A140622}th{background:#F48500;color:#FFF8EC}
  small{opacity:.7}
</style></head><body><main>
<h1>QR code scans</h1>
<table><tr><th>Code</th><th>All time</th><th>7 days</th><th>30 days</th><th>Last scan</th></tr>${totalRows}</table>
<h2>By month</h2>
<table><tr><th>Month</th><th>Code</th><th>Scans</th></tr>${monthRows}</table>
</main></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
};

export const config = { path: '/qr-stats' };
