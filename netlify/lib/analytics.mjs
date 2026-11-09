// Pure helpers shared by the analytics functions (no Netlify or Notion calls here,
// so they can be tested on their own). Lives outside netlify/functions on purpose.

export const TZ = 'America/Chicago';

// "2026-11-08" for the given instant, as the calendar date in the site's time zone.
export function localDate(date, tz = TZ) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function offsetMs(date, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// The instant when the given local calendar day starts (00:00 in the site's time zone).
export function zonedMidnight(day, tz = TZ) {
  const [y, m, d] = day.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  let guess = base;
  for (let i = 0; i < 2; i++) guess = base - offsetMs(new Date(guess), tz);
  return new Date(guess);
}

export function allowedHost(host, list) {
  const h = String(host || '').toLowerCase().split(':')[0];
  const ok = String(list || 'mexicanchilicrisp.com,www.mexicanchilicrisp.com').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return ok.includes(h);
}

const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|uptime|curl|wget|python|node-fetch|axios|facebookexternalhit|whatsapp|telegram|discord|slack/i;
export function isBot(ua) {
  return !ua || BOT_RE.test(ua);
}

// "/reserve/?x=1" → "/reserve"; "/" stays "/".
export function cleanPath(p) {
  let s = String(p || '/').split('?')[0].split('#')[0].slice(0, 100);
  if (!s.startsWith('/')) s = '/' + s;
  s = s.replace(/\/index\.html$/i, '/');
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s || '/';
}

// Where the visit came from: '' for our own pages (not counted as a source),
// '(direct)' for no referrer, otherwise just the host name (no path, no query).
export function cleanSource(referrer, ownHost) {
  const r = String(referrer || '').trim();
  if (!r) return '(direct)';
  try {
    const host = new URL(r).hostname.toLowerCase().replace(/^www\./, '');
    const own = String(ownHost || '').toLowerCase().split(':')[0].replace(/^www\./, '');
    if (!host) return '(direct)';
    if (own && host === own) return '';
    return host.slice(0, 80);
  } catch (err) {
    return '(direct)';
  }
}

const countBy = (items, key) => {
  const m = new Map();
  for (const it of items) {
    const k = key(it);
    if (k) m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
};

export function topList(map, n = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([k, v]) => k + ' (' + v + ')')
    .join('\n');
}

// hits: [{ v: visitorHash, p: path, s: source }]
export function aggregate(hits) {
  return {
    pageviews: hits.length,
    visitors: new Set(hits.map((h) => h.v)).size,
    reserveViews: hits.filter((h) => h.p === '/reserve').length,
    topPages: topList(countBy(hits, (h) => h.p)),
    topSources: topList(countBy(hits, (h) => h.s)),
  };
}
