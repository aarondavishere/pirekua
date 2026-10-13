// Netlify runs a function named "submission-created" after every verified form
// submission. This one handles the "reservation" form only:
//   1. writes the reservation to Notion (the source of truth), skipping it if a
//      page with the same Submission ID already exists (a retry never duplicates);
//   2. only after Notion succeeds, sends the customer's confirmation email through
//      Resend and records the outcome on the Notion page (Email status);
//   3. if OWNER_NOTIFY_EMAIL is set, emails the owners a short "New reservation".
// If the Notion write fails, no customer email goes out; the owners get an alert
// (when OWNER_NOTIFY_EMAIL is set) and the Netlify Forms copy is the backup.
// Plain Node 18+, built-in fetch, no dependencies. Logs never include secrets or
// full personal details: just the submission id, the step and the outcome.
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   NOTION_TOKEN        Notion internal integration secret (required)
//   NOTION_DATABASE_ID  The reservations database id (required)
//   RESEND_API_KEY      Resend API key (required for email)
//   FROM_EMAIL          Sender, e.g. "pirekua <hello@yourdomain.com>" (required for email)
//   REPLY_TO            Where replies go (recommended)
//   SITE_URL            Base URL of the site, for the logo in the email (recommended)
//   COOKBOOK_URL        Cookbook link (optional: leave empty to drop that line)
//   OWNER_NOTIFY_EMAIL  Owners' address(es), comma-separated (optional)

const NOTION_VERSION = '2022-06-28';
const MAX_QTY = 999;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LOG = (msg) => console.log('[reserve] ' + msg);

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body || '{}').payload || {};
  } catch (err) {
    LOG('could not parse submission body');
    return { statusCode: 400, body: 'Bad request' };
  }

  const formName = payload.form_name || (payload.data && payload.data['form-name']);
  if (formName !== 'reservation') {
    LOG('skipped: form "' + formName + '" is not reservation');
    return { statusCode: 200, body: 'Ignored' };
  }

  const id = String(payload.id || payload.number || '').trim();
  if (!id) {
    LOG('no submission id: cannot de-duplicate, stopping');
    return { statusCode: 400, body: 'No submission id' };
  }

  const env = readEnv();
  if (env.missing.length) {
    LOG(id + ' config: missing ' + env.missing.join(', ') + '; nothing written (the Netlify Forms copy has it)');
    return { statusCode: 500, body: 'Not configured' };
  }

  const r = parseReservation(payload.data || {});
  if (r.itemCount === 0) {
    LOG(id + ' rejected: no items reserved');
    return { statusCode: 200, body: 'No items' };
  }
  LOG(id + ' received: ' + r.itemCount + ' item(s), lang=' + r.lang + ', source=' + r.source);

  // 1. Notion (source of truth)
  let page;
  try {
    page = await findPage(env, id);
    if (page) {
      LOG(id + ' notion: already saved (' + page.id + '), not creating a duplicate');
      if (page.emailStatus === 'Sent') {
        LOG(id + ' email: already sent on an earlier run, nothing to do');
        return { statusCode: 200, body: 'Duplicate' };
      }
    } else {
      page = await createPage(env, id, r);
      page.created = true;
      LOG(id + ' notion: saved (' + page.id + ')');
    }
  } catch (err) {
    LOG(id + ' notion: FAILED (' + err.message + '); customer email not sent');
    if (env.ownerEmail.length && env.emailReady) {
      const alert = buildOwnerAlert(id, r, err.message);
      const sent = await sendEmail(env, { to: env.ownerEmail, ...alert }).catch((e) => ({ ok: false, why: e.message }));
      LOG(id + ' owner alert: ' + (sent.ok ? 'sent' : 'FAILED (' + sent.why + ')'));
    }
    return { statusCode: 500, body: 'Notion write failed' };
  }

  // 2. Customer confirmation
  let status = 'Failed';
  if (!env.emailReady) {
    LOG(id + ' email: not configured (RESEND_API_KEY / FROM_EMAIL missing)');
  } else if (!EMAIL_RE.test(r.email) || r.email.length > 254) {
    LOG(id + ' email: invalid address, not sending');
  } else {
    const msg = buildCustomerEmail(r, env);
    const sent = await sendEmail(env, { to: r.email, ...msg }).catch((e) => ({ ok: false, why: e.message }));
    status = sent.ok ? 'Sent' : 'Failed';
    LOG(id + ' email: ' + (sent.ok ? 'sent to ' + maskEmail(r.email) + ' (resend id ' + sent.resendId + ')' : 'FAILED (' + sent.why + ')'));
  }
  try {
    await setEmailStatus(env, page.id, status);
    LOG(id + ' notion: Email status = ' + status);
  } catch (err) {
    LOG(id + ' notion: could not record Email status (' + err.message + ')');
  }

  // 3. Owners (only for a new page, so a retry doesn't notify twice)
  if (env.ownerEmail.length && env.emailReady && page.created) {
    const note = buildOwnerNotice(id, r, page.url, status);
    const sent = await sendEmail(env, { to: env.ownerEmail, ...note }).catch((e) => ({ ok: false, why: e.message }));
    LOG(id + ' owner notice: ' + (sent.ok ? 'sent' : 'FAILED (' + sent.why + ')'));
  }

  return { statusCode: 200, body: status === 'Sent' ? 'Saved and sent' : 'Saved, email failed' };
};

/* ------------------------------------------------------------------ */

function readEnv() {
  const e = process.env;
  const missing = ['NOTION_TOKEN', 'NOTION_DATABASE_ID'].filter((k) => !String(e[k] || '').trim());
  return {
    missing,
    notionToken: String(e.NOTION_TOKEN || '').trim(),
    databaseId: String(e.NOTION_DATABASE_ID || '').trim(),
    resendKey: String(e.RESEND_API_KEY || '').trim(),
    from: String(e.FROM_EMAIL || '').trim(),
    replyTo: String(e.REPLY_TO || '').trim(),
    siteUrl: String(e.SITE_URL || '').trim().replace(/\/+$/, ''),
    cookbookUrl: String(e.COOKBOOK_URL || '').trim(),
    ownerEmail: String(e.OWNER_NOTIFY_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean),
    get emailReady() { return !!(this.resendKey && this.from); },
  };
}

// Never trust the browser's numbers or totals: re-read, clamp, recompute.
function parseReservation(d) {
  const str = (k, max) => String(d[k] == null ? '' : d[k]).trim().slice(0, max || 200);
  const int = (k) => {
    const n = parseInt(String(d[k] == null ? '' : d[k]).trim(), 10);   // "-3" → 0 after the clamp, "abc" → 0
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_QTY) : 0;
  };
  const q = { gift: int('gift_boxes'), sweet: int('sweet'), smoky: int('smoky'), spicy: int('spicy'), oil: int('chili_oil') };
  const lang = str('lang') === 'es' ? 'es' : 'en';
  return {
    first: str('first_name', 100),
    last: str('last_name', 100),
    email: str('email', 254),
    phone: str('phone', 40),
    address: str('address', 300),
    city: str('city', 120),
    state: str('state', 2).toUpperCase(),
    zip: str('zip', 10),
    lang,
    source: str('source', 40) || 'none',
    q,
    totals: { sweet: q.sweet + q.gift, smoky: q.smoky + q.gift, spicy: q.spicy + q.gift, oil: q.oil, mixing: q.gift },
    itemCount: q.gift + q.sweet + q.smoky + q.spicy + q.oil,
    summary: orderSummary(q),
  };
}

function orderSummary(q) {
  const parts = [];
  if (q.gift) parts.push(q.gift + (q.gift === 1 ? ' Holiday Gift Box' : ' Holiday Gift Boxes'));
  if (q.sweet) parts.push(q.sweet + ' Sweet');
  if (q.smoky) parts.push(q.smoky + ' Smoky');
  if (q.spicy) parts.push(q.spicy + ' Spicy');
  if (q.oil) parts.push(q.oil + ' Chili Oil');
  return parts.join(', ');
}

/* ---------------- Notion ---------------- */

async function notion(env, method, path, body) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + env.notionToken,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('HTTP ' + res.status + (json.code ? ' ' + json.code : '') + (json.message ? ': ' + json.message : ''));
  return json;
}

async function findPage(env, id) {
  const out = await notion(env, 'POST', '/databases/' + env.databaseId + '/query', {
    filter: { property: 'Submission ID', rich_text: { equals: id } },
    page_size: 1,
  });
  const hit = out.results && out.results[0];
  if (!hit) return null;
  const s = hit.properties && hit.properties['Email status'] && hit.properties['Email status'].select;
  return { id: hit.id, url: hit.url, emailStatus: s ? s.name : '' };
}

const text = (s) => ({ rich_text: s ? [{ type: 'text', text: { content: String(s).slice(0, 2000) } }] : [] });
const num = (n) => ({ number: n });

async function createPage(env, id, r) {
  const page = await notion(env, 'POST', '/pages', {
    parent: { database_id: env.databaseId },
    properties: {
      'Name': { title: [{ type: 'text', text: { content: (r.first + ' ' + r.last).trim().slice(0, 200) || '(no name)' } }] },
      'Submission ID': text(id),
      'Reserved at': { date: { start: new Date().toISOString() } },
      'First name': text(r.first),
      'Last name': text(r.last),
      'Email': { email: r.email || null },
      'Phone': { phone_number: r.phone || null },
      'Address': text(r.address),
      'City': text(r.city),
      'State': text(r.state),
      'ZIP': text(r.zip),
      'Gift boxes': num(r.q.gift),
      'Sweet jars': num(r.q.sweet),
      'Smoky jars': num(r.q.smoky),
      'Spicy jars': num(r.q.spicy),
      'Chili Oil': num(r.q.oil),
      'Total Sweet': num(r.totals.sweet),
      'Total Smoky': num(r.totals.smoky),
      'Total Spicy': num(r.totals.spicy),
      'Total Chili Oil': num(r.totals.oil),
      'Empty mixing jars': num(r.totals.mixing),
      'Order summary': text(r.summary),
      'Language': { select: { name: r.lang } },
      'Source': text(r.source),
    },
  });
  return { id: page.id, url: page.url };
}

function setEmailStatus(env, pageId, status) {
  return notion(env, 'PATCH', '/pages/' + pageId, { properties: { 'Email status': { select: { name: status } } } });
}

/* ---------------- Resend ---------------- */

async function sendEmail(env, { to, subject, html, text: plain }) {
  const body = { from: env.from, to: Array.isArray(to) ? to : [to], subject, html, text: plain };
  if (env.replyTo) body.reply_to = env.replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, why: 'HTTP ' + res.status + (json.name ? ' ' + json.name : '') + (json.message ? ': ' + json.message : '') };
  return { ok: true, resendId: json.id || '?' };
}

/* ---------------- Emails ---------------- */

const COPY = {
  en: {
    subject: 'Your pirekua reservation is confirmed',
    hello: '¡Hola, {name}!',
    thanks: 'Thank you for reserving your spot. This tells us how much we need to make for the holiday season, and we really appreciate it.',
    reserved: 'What you reserved',
    gift1: 'Holiday Gift Box', giftN: 'Holiday Gift Boxes',
    giftNote: 'Each gift box has one jar each of Sweet, Smoky and Spicy, an empty mixing jar with its own label, a mini whisk and a mini spatula.',
    noPay: "Nothing is charged today. Once we know the final numbers, we'll email you with the details and how to pay before anything ships.",
    shipTo: 'Shipping to',
    change: 'Need to change something? Just reply to this email.',
    cookbook: "While you wait, here's a little something for your kitchen:",
    cookbookBtn: 'The pirekua cookbook',
    signoff: 'Made with amor y risas,',
    unsub: "You're getting this because you reserved on our site. Don't want our emails? Reply \"stop\" and we'll take you off the list.",
    logoAlt: 'pirekua, Mexican chili crisp',
  },
  es: {
    subject: 'Tu reservación de pirekua está confirmada',
    hello: '¡Hola, {name}!',
    thanks: 'Gracias por reservar tu lugar. Esto nos dice cuánto necesitamos hacer para las fiestas, y te lo agradecemos de corazón.',
    reserved: 'Lo que reservaste',
    gift1: 'Caja de regalo navideña', giftN: 'Cajas de regalo navideñas',
    giftNote: 'Cada caja de regalo trae un frasco de Sweet, uno de Smoky y uno de Spicy, un frasco vacío para mezclar con su propia etiqueta, un mini batidor y una mini espátula.',
    noPay: 'Hoy no se cobra nada. Cuando sepamos los números finales, te escribiremos con los detalles y cómo pagar antes de enviar nada.',
    shipTo: 'Se enviará a',
    change: '¿Necesitas cambiar algo? Solo responde a este correo.',
    cookbook: 'Mientras tanto, aquí tienes algo para tu cocina:',
    cookbookBtn: 'El recetario de pirekua',
    signoff: 'Made with amor y risas,',
    unsub: 'Recibes esto porque reservaste en nuestro sitio. ¿No quieres nuestros correos? Responde "stop" y te daremos de baja.',
    logoAlt: 'pirekua, chili crisp mexicano',
  },
};

function itemRows(r, c) {
  const rows = [];
  if (r.q.gift) rows.push([r.q.gift === 1 ? c.gift1 : c.giftN, r.q.gift]);
  if (r.q.sweet) rows.push(['Sweet', r.q.sweet]);
  if (r.q.smoky) rows.push(['Smoky', r.q.smoky]);
  if (r.q.spicy) rows.push(['Spicy', r.q.spicy]);
  if (r.q.oil) rows.push(['Chili Oil', r.q.oil]);
  return rows;
}

const INK = '#3A1406', CREAM = '#FFF8EC', CARD = '#FFF1DA', ORANGE = '#F48500';
const FONT = "Poppins, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const P = (html, extra) => '<p style="margin:0 0 18px;font-family:' + FONT + ';font-size:17px;line-height:1.6;color:' + INK + ';' + (extra || '') + '">' + html + '</p>';

function shell({ lang, title, logo, logoAlt, inner, footer }) {
  return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>' + escapeHtml(title) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + CREAM + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + CREAM + '" style="background:' + CREAM + ';">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">' +
    (logo ? '<tr><td align="center" style="padding:0 0 24px;"><img src="' + escapeHtml(logo) + '" width="280" alt="' + escapeHtml(logoAlt) +
      '" style="display:block;width:280px;max-width:80%;height:auto;border:0;"></td></tr>' : '') +
    '<tr><td style="padding:32px 28px 12px;background:' + CARD + ';border-radius:24px;">' + inner + '</td></tr>' +
    (footer ? '<tr><td style="padding:22px 12px 0;font-family:' + FONT + ';font-size:13px;line-height:1.6;color:' + INK + ';text-align:center;">' + footer + '</td></tr>' : '') +
    '</table></td></tr></table></body></html>';
}

function itemsTable(rows) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;">' +
    rows.map(([name, n]) =>
      '<tr><td style="padding:10px 0;border-bottom:2px solid ' + CREAM + ';font-family:' + FONT + ';font-size:17px;font-weight:600;color:' + INK + ';">' + escapeHtml(name) + '</td>' +
      '<td align="right" style="padding:10px 0;border-bottom:2px solid ' + CREAM + ';font-family:' + FONT + ';font-size:17px;font-weight:800;color:' + INK + ';">× ' + n + '</td></tr>'
    ).join('') + '</table>';
}

function buildCustomerEmail(r, env) {
  const c = COPY[r.lang] || COPY.en;
  const rows = itemRows(r, c);
  const name = r.first || '';
  const hello = c.hello.replace('{name}', escapeHtml(name)).replace(/, !/, '!');
  const address = [r.address, [r.city, r.state].filter(Boolean).join(', ') + (r.zip ? ' ' + r.zip : '')].filter(Boolean);
  const cookbook = env.cookbookUrl
    ? P(escapeHtml(c.cookbook)) +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 26px;"><tr>' +
      '<td align="center" bgcolor="' + ORANGE + '" style="border-radius:999px;">' +
      '<a href="' + escapeHtml(env.cookbookUrl) + '" style="display:inline-block;padding:14px 28px;font-family:' + FONT +
      ';font-size:17px;font-weight:700;line-height:1;color:' + INK + ';text-decoration:none;border-radius:999px;">' + escapeHtml(c.cookbookBtn) + '</a>' +
      '</td></tr></table>'
    : '';
  const inner =
    P(hello, 'font-size:22px;font-weight:700;') +
    P(escapeHtml(c.thanks)) +
    P(escapeHtml(c.reserved), 'margin-bottom:6px;font-weight:800;') +
    itemsTable(rows) +
    (r.q.gift ? P(escapeHtml(c.giftNote), 'font-size:15px;') : '') +
    P(escapeHtml(c.noPay)) +
    (address.length ? P('<strong>' + escapeHtml(c.shipTo) + '</strong><br>' + address.map(escapeHtml).join('<br>'), 'font-size:15px;') : '') +
    P(escapeHtml(c.change)) +
    cookbook +
    P(escapeHtml(c.signoff) + '<br><strong>pirekua</strong>');
  const html = shell({
    lang: r.lang, title: c.subject, logo: env.siteUrl ? env.siteUrl + '/assets/lockup-primary.png' : '', logoAlt: c.logoAlt, inner,
    footer: escapeHtml(c.unsub) + '<br>[BUSINESS NAME + MAILING ADDRESS]',
  });
  const plain = [
    c.hello.replace('{name}', name).replace(/, !/, '!'), '',
    c.thanks, '',
    c.reserved + ':',
    ...rows.map(([n, q]) => '  ' + n + ' × ' + q),
    '',
    ...(r.q.gift ? [c.giftNote, ''] : []),
    c.noPay, '',
    ...(address.length ? [c.shipTo + ':', ...address.map((a) => '  ' + a), ''] : []),
    c.change, '',
    ...(env.cookbookUrl ? [c.cookbook + ' ' + c.cookbookBtn + ' → ' + env.cookbookUrl, ''] : []),
    c.signoff, 'pirekua', '', '—',
    c.unsub, '[BUSINESS NAME + MAILING ADDRESS]',
  ].join('\n');
  return { subject: c.subject, html, text: plain };
}

function ownerLines(r) {
  return [
    ['Name', (r.first + ' ' + r.last).trim()],
    ['Order', r.summary],
    ['Production', r.totals.sweet + ' Sweet, ' + r.totals.smoky + ' Smoky, ' + r.totals.spicy + ' Spicy, ' + r.totals.oil + ' Chili Oil' + (r.totals.mixing ? ', ' + r.totals.mixing + ' empty mixing jar(s)' : '')],
    ['Email', r.email],
    ['Phone', r.phone],
    ['Address', [r.address, r.city, r.state, r.zip].filter(Boolean).join(', ')],
    ['Language', r.lang],
    ['Source', r.source],
  ];
}

function buildOwnerNotice(id, r, pageUrl, emailStatus) {
  const subject = 'New reservation: ' + r.summary;
  const lines = ownerLines(r).concat([['Confirmation email', emailStatus], ['Submission ID', id]]);
  const inner = P('<strong>New reservation</strong>', 'font-size:20px;') +
    lines.map(([k, v]) => P('<strong>' + escapeHtml(k) + ':</strong> ' + escapeHtml(v), 'margin-bottom:6px;font-size:15px;')).join('') +
    (pageUrl ? P('<a href="' + escapeHtml(pageUrl) + '" style="color:' + INK + ';font-weight:700;">Open it in Notion</a>', 'margin-top:14px;') : '');
  const html = shell({ lang: 'en', title: subject, logo: '', logoAlt: '', inner });
  const plain = ['New reservation', '', ...lines.map(([k, v]) => k + ': ' + v), '', pageUrl ? 'Notion: ' + pageUrl : ''].join('\n');
  return { subject, html, text: plain };
}

function buildOwnerAlert(id, r, why) {
  const subject = 'Action needed: a reservation did not reach Notion (' + id + ')';
  const lines = [['Submission ID', id], ['Error', why]].concat(ownerLines(r));
  const inner = P('<strong>A reservation could not be saved to Notion.</strong>', 'font-size:20px;') +
    P('No confirmation email went to the customer. The submission is safe in Netlify → Forms → reservation. Add it to Notion by hand (or fix the setting and re-run), then let the customer know.') +
    lines.map(([k, v]) => P('<strong>' + escapeHtml(k) + ':</strong> ' + escapeHtml(v), 'margin-bottom:6px;font-size:15px;')).join('');
  const html = shell({ lang: 'en', title: subject, logo: '', logoAlt: '', inner });
  const plain = ['A reservation could not be saved to Notion.', 'No confirmation email went to the customer. The submission is safe in Netlify → Forms → reservation.', '', ...lines.map(([k, v]) => k + ': ' + v)].join('\n');
  return { subject, html, text: plain };
}

/* ---------------- Helpers ---------------- */

function maskEmail(email) {
  const [user, domain] = String(email).split('@');
  return (user || '').slice(0, 2) + '***@' + (domain || '');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Exposed for local testing.
exports._test = { parseReservation, buildCustomerEmail, buildOwnerNotice, buildOwnerAlert, orderSummary };
