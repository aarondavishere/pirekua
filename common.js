/* pirekua — shared page pieces: missing-art placeholders, chile confetti,
   dialogs and the privacy policy. Needs i18n.js first (window.pirekua). */

// Party links (data-party): how long the confetti plays before the page changes.
const PARTY_NAV_DELAY_MS = 450;

(() => {
  'use strict';

  const P = window.pirekua;
  const reduceMotion = P.reduceMotion;

  /* ---------------------------------------------------------------
     Missing brand art: show a labeled placeholder, never a substitute
     --------------------------------------------------------------- */
  function toPlaceholder(img) {
    // data-fallback: one file, or several separated by "|", tried in order.
    // data-fallback-class: added to the parent when the LAST fallback is used
    // (e.g. a jar cutout falling back to its studio render, which needs the old crop).
    const list = (img.dataset.fallback || '').split('|').filter(Boolean);
    const step = Number(img.dataset.fallbackStep || 0);
    if (step < list.length) {
      if (!img.dataset.triedFallback) img.dataset.triedFallback = img.getAttribute('src').split('/').pop();
      img.dataset.fallbackStep = String(step + 1);
      if (step === list.length - 1 && img.dataset.fallbackClass && img.parentElement) img.parentElement.classList.add(img.dataset.fallbackClass);
      img.src = list[step];
      return;
    }
    const tried = img.dataset.triedFallback;
    const file = (tried ? tried + ' or ' : '') + (img.getAttribute('src') || '').split('/').pop();
    const ph = document.createElement('div');
    ph.className = img.className + ' asset-ph';
    ph.textContent = file;
    ph.setAttribute('aria-hidden', 'true');
    if (img.alt) {
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', img.alt);
      ph.removeAttribute('aria-hidden');
      const attrs = img.dataset.i18nAttr;
      if (attrs) ph.dataset.i18nAttr = attrs.replace(/\balt:/, 'aria-label:');
    }
    const w = img.getAttribute('width'), h = img.getAttribute('height');
    if (w && h) ph.style.aspectRatio = w + ' / ' + h;
    if (!ph.style.width) ph.style.width = getComputedStyle(img).width;
    img.replaceWith(ph);
  }
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => toPlaceholder(img));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) toPlaceholder(img);
  });

  // Background tiles ([data-bg]): load if present, otherwise label the gap.
  document.querySelectorAll('[data-bg]').forEach((el) => {
    const src = el.dataset.bg;
    const probe = new Image();
    probe.onload = () => { el.style.backgroundImage = 'url("' + src + '")'; };
    probe.onerror = () => {
      const tag = document.createElement('span');
      tag.className = 'media-slot__missing';
      tag.setAttribute('aria-hidden', 'true');
      tag.textContent = src.split('/').pop();
      el.appendChild(tag);
    };
    probe.src = src;
  });

  /* ---------------------------------------------------------------
     Party: chile-confetti burst. A plain primary click on a link with
     data-party fires it, then follows the link after PARTY_NAV_DELAY_MS
     (straight away with reduced motion; Cmd/Ctrl/middle/right clicks are
     left alone). Buttons with data-party call pirekua.party(button) themselves,
     e.g. the Reserve button fires it only once the reservation goes through.
     --------------------------------------------------------------- */
  // Root-relative so the burst works on every page (/, /reserve/, …).
  const PARTY_ART = [
    '/assets/chile-sweet.png', '/assets/chile-smoky.png', '/assets/chile-spicy.png',
    '/assets/chile-sweet-flip.png', '/assets/chile-smoky-flip.png', '/assets/chile-spicy-flip.png',
  ];
  const PARTY_LEAVES = ['/assets/leaf-1.png', '/assets/leaf-2.png'];
  // Warm the cache so the first burst has its art ready.
  const preload = () => PARTY_ART.concat(PARTY_LEAVES).forEach((src) => { const i = new Image(); i.src = src; });
  if (document.querySelector('[data-party]')) {
    ('requestIdleCallback' in window ? requestIdleCallback : setTimeout)(preload);
  }

  function partyBurst(button) {
    if (reduceMotion()) return;
    const rect = button.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height * 0.35;
    const layer = document.createElement('div');
    layer.className = 'party-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const count = 18 + Math.floor(Math.random() * 7);   // 18–24
    const DURATION = 1150;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const leaf = Math.random() < 0.14;
      const img = document.createElement('img');
      img.alt = '';
      img.src = leaf ? PARTY_LEAVES[i % 2] : PARTY_ART[Math.floor(Math.random() * PARTY_ART.length)];
      img.onerror = () => img.remove();
      const h = leaf ? 16 + Math.random() * 10 : 26 + Math.random() * 18;
      img.style.width = (leaf ? h * 1.4 : h * 0.55) + 'px';
      layer.appendChild(img);
      // Fan outward and up: -160deg .. -20deg
      const ang = (-160 + Math.random() * 140) * Math.PI / 180;
      const speed = 420 + Math.random() * 380;           // px/s
      parts.push({
        img, x: ox, y: oy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 120,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 540,                  // deg/s, slight spin
        delay: Math.random() * 60,
      });
    }
    const G = 1500;                                       // px/s^2
    const t0 = performance.now();
    let prev = t0;
    function frame(now) {
      const t = now - t0;
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      for (const p of parts) {
        if (t < p.delay) { p.img.style.opacity = '0'; continue; }
        p.vy += G * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const life = (t - p.delay) / (DURATION - p.delay);
        const fade = life < 0.55 ? 1 : Math.max(0, 1 - (life - 0.55) / 0.45);
        p.img.style.opacity = fade.toFixed(3);
        p.img.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + p.rot.toFixed(1) + 'deg)';
      }
      if (t < DURATION) requestAnimationFrame(frame);
      else layer.remove();
    }
    requestAnimationFrame(frame);
  }

  document.querySelectorAll('a[data-party]').forEach((link) => link.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target && link.target !== '_self') return;
    if (reduceMotion()) return;              // no confetti: just go
    e.preventDefault();
    if (link.dataset.leaving) return;        // a second click while it's already leaving
    link.dataset.leaving = '1';
    partyBurst(link);
    setTimeout(() => { delete link.dataset.leaving; window.location.assign(link.href); }, PARTY_NAV_DELAY_MS);
  }));
  // Coming back with the browser's Back button can restore this page from cache.
  window.addEventListener('pageshow', () => document.querySelectorAll('a[data-leaving]').forEach((a) => delete a.dataset.leaving));

  /* ---------------------------------------------------------------
     Dialogs: focus trap, Escape and backdrop
     close, focus returns to the button that opened it
     --------------------------------------------------------------- */
  function createDialog(dialog, opts) {
    let opener = null;
    const getFocusables = () => Array.from(dialog.querySelectorAll(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.disabled && el.offsetParent !== null && !el.closest('.hp'));

    function open(trigger) {
      opener = trigger || document.activeElement;
      if (opts && opts.beforeOpen) opts.beforeOpen(trigger);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        const target = opts && opts.initialFocus ? opts.initialFocus() : getFocusables()[0];
        if (target) target.focus();
      });
    }
    function close() {
      if (!dialog.open) return;
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); onClosed(); }
    }
    function onClosed() {
      document.documentElement.style.overflow = '';
      if (opener && typeof opener.focus === 'function') opener.focus();
      opener = null;
    }
    dialog.addEventListener('close', onClosed);
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = getFocusables();
      if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
    dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    return { open, close };
  }

  /* ---------------- Privacy policy ---------------- */
  const privacyDialog = document.getElementById('privacy-modal');
  if (privacyDialog) {
    const privacy = createDialog(privacyDialog, {
      initialFocus: () => privacyDialog.querySelector('.modal__close'),
    });
    document.querySelectorAll('[data-privacy]').forEach((b) => b.addEventListener('click', () => {
      privacyDialog.querySelector('.modal__panel').scrollTop = 0;
      privacy.open(b);
    }));
  }

  Object.assign(P, { toPlaceholder, party: partyBurst, createDialog });
})();
