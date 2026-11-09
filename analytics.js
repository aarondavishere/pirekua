/* pirekua — privacy-friendly page counter. One tiny POST per page load to our own
   Netlify function (/api/collect). No cookies, no localStorage, no third parties,
   nothing that identifies a person. Skipped for Do Not Track / Global Privacy Control
   and for local development. */
(() => {
  'use strict';
  try {
    if (navigator.doNotTrack === '1' || window.globalPrivacyControl) return;
    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return;

    const body = JSON.stringify({ p: location.pathname, r: document.referrer || '' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/collect', new Blob([body], { type: 'text/plain' }));
    } else {
      fetch('/api/collect', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
    }
  } catch (err) { /* analytics must never break the page */ }
})();
