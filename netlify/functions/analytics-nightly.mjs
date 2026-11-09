// Scheduled function: runs every night at 06:05 UTC (12:05 am CST / 1:05 am CDT in
// Chicago, so "yesterday" is always finished). It
//   1. totals the page-view records in Netlify Blobs for each finished day,
//   2. counts that day's reservations in the Reservations database,
//   3. writes (or updates) one row per day in the Site Analytics database in Notion,
//   4. then deletes that day's raw records.
// If Notion fails, the raw records are kept and the next night retries them.
// Days with no visits still get a row (zeros) so charts have no gaps.
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   NOTION_TOKEN                   Same integration secret the reservation function uses
//   NOTION_DATABASE_ID             The Reservations database (already set)
//   NOTION_ANALYTICS_DATABASE_ID   The Site Analytics database (new)
// The integration must be connected to the Site Analytics database too
// (Notion → ••• → Connections).

import { getStore } from '@netlify/blobs';
import { addDays, aggregate, localDate, zonedMidnight } from '../lib/analytics.mjs';

const NOTION_VERSION = '2022-06-28';
const LOG = (msg) => console.log('[analytics] ' + msg);

export default async () => {
  const token = String(process.env.NOTION_TOKEN || '').trim();
  const reservationsDb = String(process.env.NOTION_DATABASE_ID || '').trim();
  const analyticsDb = String(process.env.NOTION_ANALYTICS_DATABASE_ID || '').trim();
  const missing = [['NOTION_TOKEN', token], ['NOTION_DATABASE_ID', reservationsDb], ['NOTION_ANALYTICS_DATABASE_ID', analyticsDb]]
    .filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    LOG('config: missing ' + missing.join(', ') + '; nothing written');
    return;
  }
  const notion = makeNotion(token);
  const store = getStore('pageviews');

  const today = localDate(new Date());
  const yesterday = addDays(today, -1);

  // Every finished day that still has raw records, plus yesterday (even if empty).
  const listing = await store.list({ directories: true });
  const days = new Set((listing.directories || []).map((d) => d.replace(/\/$/, '')).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < today));
  days.add(yesterday);

  for (const day of [...days].sort()) {
    try {
      const keys = await listKeys(store, day + '/');
      const hits = await readAll(store, keys);
      const totals = aggregate(hits);
      const reservations = await countReservations(notion, reservationsDb, day);
      await upsertRow(notion, analyticsDb, day, { ...totals, reservations });
      for (const k of keys) await store.delete(k);
      LOG(day + ': ' + totals.pageviews + ' views, ' + totals.visitors + ' visitors, ' + reservations + ' reservations; row saved, raw records removed');
    } catch (err) {
      LOG(day + ': FAILED (' + err.message + '); raw records kept, will retry tomorrow');
    }
  }
};

export const config = { schedule: '5 6 * * *' };

/* ---------------- Blobs ---------------- */

async function listKeys(store, prefix) {
  const keys = [];
  for await (const page of store.list({ prefix, paginate: true })) {
    for (const b of page.blobs) keys.push(b.key);
  }
  return keys;
}

async function readAll(store, keys) {
  const out = [];
  for (let i = 0; i < keys.length; i += 25) {
    const chunk = await Promise.all(keys.slice(i, i + 25).map((k) => store.get(k, { type: 'json' }).catch(() => null)));
    for (const h of chunk) if (h && h.v && h.p) out.push(h);
  }
  return out;
}

/* ---------------- Notion ---------------- */

function makeNotion(token) {
  return async (method, path, body) => {
    const res = await fetch('https://api.notion.com/v1' + path, {
      method,
      headers: { Authorization: 'Bearer ' + token, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('Notion HTTP ' + res.status + (json.code ? ' ' + json.code : '') + (json.message ? ': ' + json.message : ''));
    return json;
  };
}

async function countReservations(notion, dbId, day) {
  const start = zonedMidnight(day).toISOString();
  const end = zonedMidnight(addDays(day, 1)).toISOString();
  let count = 0, cursor;
  do {
    const out = await notion('POST', '/databases/' + dbId + '/query', {
      filter: { and: [
        { property: 'Reserved at', date: { on_or_after: start } },
        { property: 'Reserved at', date: { before: end } },
      ] },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    count += (out.results || []).length;
    cursor = out.has_more ? out.next_cursor : undefined;
  } while (cursor);
  return count;
}

const text = (s) => ({ rich_text: s ? [{ type: 'text', text: { content: String(s).slice(0, 2000) } }] : [] });

async function upsertRow(notion, dbId, day, t) {
  const properties = {
    'Name': { title: [{ type: 'text', text: { content: day } }] },
    'Date': { date: { start: day } },
    'Pageviews': { number: t.pageviews },
    'Unique visitors': { number: t.visitors },
    'Reserve page views': { number: t.reserveViews },
    'Reservations': { number: t.reservations },
    'Top sources': text(t.topSources),
    'Top pages': text(t.topPages),
  };
  const found = await notion('POST', '/databases/' + dbId + '/query', {
    filter: { property: 'Name', title: { equals: day } },
    page_size: 1,
  });
  const hit = found.results && found.results[0];
  if (hit) await notion('PATCH', '/pages/' + hit.id, { properties });
  else await notion('POST', '/pages', { parent: { database_id: dbId }, properties });
}
