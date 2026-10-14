// The short links behind the printed QR codes. Each scan of /q/<code> is
// counted in Netlify Database (code, country, time; no IP or personal details),
// then the visitor is sent on to the page set in CODES below.
//
// Change a destination here at any time: the printed codes never need reprinting.
// Unknown codes still go to the home page, they just aren't counted.

import { getDatabase } from '@netlify/database';

export const CODES = {
  // On the jar / packaging: people who already bought, coming back for more.
  pack: '/reserve/?utm_source=packaging&utm_medium=qr&utm_campaign=repeat',
  // Flyers, posters, markets, social: general marketing.
  promo: '/?utm_source=marketing&utm_medium=qr&utm_campaign=general',
};

const LOG = (msg) => console.log('[qr] ' + msg);

export default async (req, context) => {
  const code = String(context.params.code || '').toLowerCase();
  const target = CODES[code];
  if (!target) return Response.redirect(new URL('/', req.url), 302);

  try {
    const db = getDatabase();
    const country = context.geo?.country?.code || null;
    await db.sql`INSERT INTO qr_scans (code, country) VALUES (${code}, ${country})`;
  } catch (err) {
    // A failed count never blocks the visitor.
    LOG('could not record scan for "' + code + '": ' + err.message);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: new URL(target, req.url).toString(), 'Cache-Control': 'no-store' },
  });
};

export const config = { path: '/q/:code' };
