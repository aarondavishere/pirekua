// POST /api/collect: the page-counter beacon (see /analytics.js).
// Stores one small record per page view in Netlify Blobs under "<day>/<random id>".
// The nightly function (analytics-nightly.mjs) totals them into Notion and then
// deletes them. A record holds only: a one-day anonymous visitor hash, the page
// path, and where the visit came from (a host name). No IP address, no cookie, no
// user agent is stored, and the hash changes every day, so nobody is followed
// from one day to the next.
//
// Optional environment variables:
//   ANALYTICS_HOSTS  Comma-separated host names to count
//                    (default: mexicanchilicrisp.com,www.mexicanchilicrisp.com),
//                    so deploy previews and *.netlify.app never pollute the numbers
//   ANALYTICS_SALT   Any random string; mixed into the visitor hash

import { getStore } from '@netlify/blobs';
import { createHash, randomUUID } from 'node:crypto';
import { allowedHost, cleanPath, cleanSource, isBot, localDate } from '../lib/analytics.mjs';

const NO_CONTENT = () => new Response(null, { status: 204 });

export default async (req, context) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });

  try {
    const host = req.headers.get('host') || new URL(req.url).host;
    const ua = req.headers.get('user-agent') || '';
    if (!allowedHost(host, process.env.ANALYTICS_HOSTS) || isBot(ua)) return NO_CONTENT();

    let body = {};
    try { body = JSON.parse(await req.text()); } catch (err) { return new Response(null, { status: 400 }); }

    const day = localDate(new Date());
    const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || '';
    const salt = process.env.ANALYTICS_SALT || 'pirekua';
    const visitor = createHash('sha256').update([salt, day, ip, ua].join('|')).digest('hex').slice(0, 16);

    const hit = { v: visitor, p: cleanPath(body.p), s: cleanSource(body.r, host) };
    await getStore('pageviews').setJSON(day + '/' + randomUUID(), hit);
  } catch (err) {
    console.log('[analytics] collect failed: ' + err.message);   // never bother the visitor
  }
  return NO_CONTENT();
};

export const config = { path: '/api/collect' };
