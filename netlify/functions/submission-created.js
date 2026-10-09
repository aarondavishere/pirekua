// Netlify runs a function named "submission-created" after every verified form
// submission. This one sends the pirekua welcome email through Resend.
// Plain Node 18+, built-in fetch, no dependencies.
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   RESEND_API_KEY  Resend API key
//   FROM_EMAIL      Sender, e.g. "pirekua <hello@yourdomain.com>"
//   REPLY_TO        Where replies go
//   SITE_URL        Base URL of the site, used for the logo image
//   COOKBOOK_URL    Link to the cookbook (optional: leave empty to drop that line)
//
// Phone-only signups get no automatic message. Texts are sent by hand from the
// Netlify Forms export.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body || '{}').payload || {};
  } catch (err) {
    console.log('[welcome] could not parse submission body');
    return { statusCode: 400, body: 'Bad request' };
  }

  const formName = payload.form_name || (payload.data && payload.data['form-name']);
  if (formName !== 'signup') {
    console.log('[welcome] skipped: form "' + formName + '" is not signup');
    return { statusCode: 200, body: 'Ignored' };
  }

  const data = payload.data || {};
  const email = String(data.email || '').trim();
  const source = String(data.source || 'unknown');
  const lang = String(data.lang || 'en');

  if (!email) {
    console.log('[welcome] no email (phone-only signup, source=' + source + ', lang=' + lang + '): nothing to send');
    return { statusCode: 200, body: 'No email' };
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    console.log('[welcome] invalid email address, not sending (source=' + source + ')');
    return { statusCode: 200, body: 'Invalid email' };
  }

  const { RESEND_API_KEY, FROM_EMAIL, REPLY_TO } = process.env;
  const SITE_URL = String(process.env.SITE_URL || '').replace(/\/+$/, '');
  const COOKBOOK_URL = String(process.env.COOKBOOK_URL || '').trim();

  if (!RESEND_API_KEY || !FROM_EMAIL) {
    console.log('[welcome] missing RESEND_API_KEY or FROM_EMAIL: cannot send');
    return { statusCode: 500, body: 'Email is not configured' };
  }

  // Every signup gets the same English email for now (lang is stored for later).
  const message = buildEmail({ siteUrl: SITE_URL, cookbookUrl: COOKBOOK_URL });
  const body = {
    from: FROM_EMAIL,
    to: [email],
    subject: message.subject,
    html: message.html,
    text: message.text,
  };
  if (REPLY_TO) body.reply_to = REPLY_TO;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.log('[welcome] Resend refused the send: HTTP ' + res.status + ' ' + JSON.stringify(result));
      return { statusCode: 500, body: 'Send failed' };
    }
    console.log('[welcome] sent to ' + maskEmail(email) + ' (id=' + (result.id || '?') + ', source=' + source + ', lang=' + lang + ')');
    return { statusCode: 200, body: 'Sent' };
  } catch (err) {
    console.log('[welcome] network error talking to Resend: ' + (err && err.message));
    return { statusCode: 500, body: 'Send failed' };
  }
};

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return (user.slice(0, 2) || '') + '***@' + domain;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildEmail({ siteUrl, cookbookUrl }) {
  const subject = "You're in. Welcome to pirekua.";
  const ink = '#3A1406', cream = '#FFF8EC', card = '#FFF1DA', orange = '#F48500';
  const font = "Poppins, 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const logo = siteUrl ? siteUrl + '/assets/lockup-primary.png' : '';

  const p = (html, extra) =>
    '<p style="margin:0 0 18px;font-family:' + font + ';font-size:17px;line-height:1.6;color:' + ink + ';' + (extra || '') + '">' + html + '</p>';

  const cookbookBlock = cookbookUrl
    ? p("We'll be in touch when the jars are ready. Until then, here's a little something for your kitchen:") +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 26px;"><tr>' +
      '<td align="center" bgcolor="' + orange + '" style="border-radius:999px;">' +
      '<a href="' + escapeHtml(cookbookUrl) + '" style="display:inline-block;padding:14px 28px;font-family:' + font +
      ';font-size:17px;font-weight:700;line-height:1;color:' + ink + ';text-decoration:none;border-radius:999px;">The pirekua cookbook</a>' +
      '</td></tr></table>'
    : p("We'll be in touch when the jars are ready.");

  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>' + escapeHtml(subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + cream + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + cream + '" style="background:' + cream + ';">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">' +
    (logo
      ? '<tr><td align="center" style="padding:0 0 24px;"><img src="' + escapeHtml(logo) +
        '" width="280" alt="pirekua, Mexican chili crisp" style="display:block;width:280px;max-width:80%;height:auto;border:0;"></td></tr>'
      : '') +
    '<tr><td style="padding:32px 28px 12px;background:' + card + ';border-radius:24px;">' +
    p('¡Hola!', 'font-size:22px;font-weight:700;') +
    p("You're on the list, and we're really glad you're here.") +
    p("pirekua started with two friends, a stove, and a lot of laughing. Now it's Mexican chili crisp, made with amor y risas, and you're one of the first to know about it.") +
    cookbookBlock +
    p('Made with amor y risas,<br><strong>pirekua</strong>') +
    '</td></tr>' +
    '<tr><td style="padding:22px 12px 0;font-family:' + font + ';font-size:13px;line-height:1.6;color:' + ink + ';text-align:center;">' +
    'Don\'t want these? Just reply "stop" and we\'ll take you off the list.<br>[BUSINESS NAME + MAILING ADDRESS]' +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';

  const text = [
    '¡Hola!',
    '',
    "You're on the list, and we're really glad you're here.",
    '',
    "pirekua started with two friends, a stove, and a lot of laughing. Now it's Mexican chili crisp, made with amor y risas, and you're one of the first to know about it.",
    '',
    cookbookUrl
      ? "We'll be in touch when the jars are ready. Until then, here's a little something for your kitchen: the pirekua cookbook → " + cookbookUrl
      : "We'll be in touch when the jars are ready.",
    '',
    'Made with amor y risas,',
    'pirekua',
    '',
    '—',
    'Don\'t want these? Just reply "stop" and we\'ll take you off the list.',
    '[BUSINESS NAME + MAILING ADDRESS]',
  ].join('\n');

  return { subject, html, text };
}

// Exposed for local testing.
exports.buildEmail = buildEmail;
