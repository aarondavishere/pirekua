/* pirekua — pass 1 interactions. Vanilla JS, no dependencies. */

// How often the headline flips language on touch devices (ms).
const HEADLINE_FLIP_MS = 10000;
// How long the flipped language stays up before flipping back (ms).
const HEADLINE_HOLD_MS = 3500;

(() => {
  'use strict';

  const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const noHoverMQ = window.matchMedia('(hover: none)');
  const reduceMotion = () => reduceMotionMQ.matches;
  const isTouch = () => noHoverMQ.matches;

  /* ---------------------------------------------------------------
     Missing brand art: show a labeled placeholder, never a substitute
     --------------------------------------------------------------- */
  function toPlaceholder(img) {
    const fallback = img.dataset.fallback;
    if (fallback && !img.dataset.triedFallback) {
      img.dataset.triedFallback = img.getAttribute('src').split('/').pop();
      img.src = fallback;
      return;
    }
    const tried = img.dataset.triedFallback;
    const file = (tried ? tried + ' or ' : '') + (img.getAttribute('src') || '').split('/').pop();
    const ph = document.createElement('div');
    ph.className = img.className + ' asset-ph';
    ph.textContent = file;
    ph.setAttribute('aria-hidden', 'true');
    if (img.alt) { ph.setAttribute('role', 'img'); ph.setAttribute('aria-label', img.alt); ph.removeAttribute('aria-hidden'); }
    const w = img.getAttribute('width'), h = img.getAttribute('height');
    if (w && h) ph.style.aspectRatio = w + ' / ' + h;
    if (!ph.style.width) ph.style.width = getComputedStyle(img).width;
    img.replaceWith(ph);
  }
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => toPlaceholder(img));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) toPlaceholder(img);
  });

  /* ---------------------------------------------------------------
     Headline: bilingual hover swap (desktop) + timed flip (touch)
     --------------------------------------------------------------- */
  const halves = Array.from(document.querySelectorAll('[data-half]'));
  let pausedBy = 0;

  halves.forEach((half) => {
    const on = () => { half.classList.add('is-swapped'); pausedBy++; };
    const off = () => { half.classList.remove('is-swapped'); pausedBy = Math.max(0, pausedBy - 1); };
    half.addEventListener('mouseenter', () => { if (!isTouch()) on(); });
    half.addEventListener('mouseleave', () => { if (!isTouch()) off(); });
    half.addEventListener('focus', on);
    half.addEventListener('blur', off);
  });

  let flipTimer = null, holdTimer = null;
  function startFlipTimer() {
    stopFlipTimer();
    if (!isTouch() || reduceMotion() || !halves.length) return;
    flipTimer = setInterval(() => {
      if (pausedBy > 0 || document.hidden) return;
      halves.forEach((h) => h.classList.add('is-swapped'));
      holdTimer = setTimeout(() => {
        if (pausedBy === 0) halves.forEach((h) => h.classList.remove('is-swapped'));
      }, HEADLINE_HOLD_MS);
    }, HEADLINE_FLIP_MS);
  }
  function stopFlipTimer() {
    clearInterval(flipTimer); clearTimeout(holdTimer);
    flipTimer = holdTimer = null;
  }
  startFlipTimer();
  reduceMotionMQ.addEventListener('change', startFlipTimer);
  noHoverMQ.addEventListener('change', startFlipTimer);

  /* ---------------------------------------------------------------
     Ristra: five hanging chiles, damped-spring pendulums
     --------------------------------------------------------------- */
  const ristra = document.querySelector('.ristra');
  if (ristra) {
    const MAX_ANGLE = 18 * Math.PI / 180;   // hard cap
    const STIFFNESS = 58;                     // spring k  (period ~0.8s)
    const DAMPING = 4.6;                      // settles in ~1.5s
    const GAIN = 0.55;                        // pointer speed -> angular velocity
    const MAX_KICK = 3.2;                     // rad/s

    const chiles = Array.from(ristra.querySelectorAll('[data-chile]')).map((el) => ({
      el, swing: el.querySelector('.ristra__swing'), a: 0, v: 0,
    }));
    let raf = 0, last = 0;

    function step(now) {
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
      last = now;
      let moving = false;
      for (const c of chiles) {
        const acc = -STIFFNESS * c.a - DAMPING * c.v;
        c.v += acc * dt;
        c.a += c.v * dt;
        if (c.a > MAX_ANGLE) { c.a = MAX_ANGLE; c.v = Math.min(c.v, 0); }
        if (c.a < -MAX_ANGLE) { c.a = -MAX_ANGLE; c.v = Math.max(c.v, 0); }
        if (Math.abs(c.a) < 0.0006 && Math.abs(c.v) < 0.003) { c.a = 0; c.v = 0; }
        else moving = true;
        c.swing.style.transform = 'rotate(' + c.a.toFixed(4) + 'rad)';
      }
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    function kick(c, angularVelocity) {
      if (reduceMotion()) return;
      c.v = Math.max(-MAX_KICK, Math.min(MAX_KICK, c.v + angularVelocity));
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    }

    // Cursor or finger moving across a chile nudges it in that direction.
    let px = null, pt = 0;
    function onMove(e) {
      const now = e.timeStamp || performance.now();
      if (px !== null) {
        const dx = e.clientX - px;
        const dtm = Math.max(8, now - pt);
        const vx = dx / dtm;                       // px per ms
        if (Math.abs(vx) > 0.02) {
          for (const c of chiles) {
            const r = c.el.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
              // moving right pushes the chile's body right (counter-clockwise)
              kick(c, -vx * GAIN * Math.min(1.6, dtm / 16));
            }
          }
        }
      }
      px = e.clientX; pt = now;
    }
    ristra.addEventListener('pointermove', onMove, { passive: true });
    ristra.addEventListener('pointerleave', () => { px = null; });
    ristra.addEventListener('pointerdown', (e) => { px = e.clientX; pt = e.timeStamp; });
    ristra.addEventListener('pointercancel', () => { px = null; });

    // Touch: one gentle unprompted swing the first time the divider is seen.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        if (!isTouch() || reduceMotion()) return;
        chiles.forEach((c, i) => setTimeout(() => kick(c, (i % 2 ? -1 : 1) * 1.6), i * 90));
      }, { threshold: 0.6 });
      io.observe(ristra);
    }
  }

  /* ---------------------------------------------------------------
     Party button: chile-confetti burst (any [data-party] button)
     --------------------------------------------------------------- */
  const PARTY_ART = [
    'assets/chile-sweet.png', 'assets/chile-smoky.png', 'assets/chile-spicy.png',
    'assets/chile-sweet-flip.png', 'assets/chile-smoky-flip.png', 'assets/chile-spicy-flip.png',
  ];
  const PARTY_LEAVES = ['assets/leaf-1.png', 'assets/leaf-2.png'];
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

  /* ---------------------------------------------------------------
     Signup modal (reusable: any [data-signup] button opens it)
     --------------------------------------------------------------- */
  const modal = document.getElementById('signup-modal');
  if (!modal) return;
  const form = modal.querySelector('form');
  const formView = modal.querySelector('[data-form-view]');
  const successView = modal.querySelector('[data-success-view]');
  const msg = modal.querySelector('#signup-msg');
  const emailEl = form.elements.email;
  const phoneEl = form.elements.phone;
  let opener = null;

  const MESSAGES = {
    empty: 'Add an email or a phone number so we can reach you.',
    email: 'That email looks a little off. Mind checking it?',
    phone: 'That number looks a little off. Mind checking it?',
    failed: 'Something got lost on the way. Give it another try in a moment.',
  };

  function resetForm() {
    form.reset();
    form.classList.remove('is-sending');
    msg.textContent = '';
    [emailEl, phoneEl].forEach((el) => el.removeAttribute('aria-invalid'));
    formView.hidden = false;
    successView.hidden = true;
  }

  function openModal(source, trigger) {
    opener = trigger || document.activeElement;
    if (successView.hidden === false) resetForm();
    form.elements.source.value = source || 'unknown';
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => emailEl.focus());
  }

  function closeModal() {
    if (!modal.open) return;
    if (typeof modal.close === 'function') modal.close();
    else { modal.removeAttribute('open'); onClosed(); }
  }
  function onClosed() {
    document.documentElement.style.overflow = '';
    if (opener && typeof opener.focus === 'function') opener.focus();
    opener = null;
  }
  modal.addEventListener('close', onClosed);

  // Escape (native dialog fires "cancel"; we close the same way)
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    // Focus trap
    const focusables = Array.from(modal.querySelectorAll(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.disabled && el.offsetParent !== null && !el.closest('.signup__hp'));
    if (!focusables.length) return;
    const first = focusables[0], lastEl = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
  // Backdrop click (the dialog element itself is the backdrop area)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));

  document.querySelectorAll('[data-signup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const source = btn.dataset.source || 'unknown';
      if (btn.hasAttribute('data-party') && !reduceMotion()) {
        partyBurst(btn);
        setTimeout(() => openModal(source, btn), 400);
      } else {
        openModal(source, btn);
      }
    });
  });

  // Validation
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validPhone(v) {
    if (!/^[+\d\s().-]+$/.test(v)) return false;
    const digits = v.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }
  function validate() {
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();
    emailEl.removeAttribute('aria-invalid');
    phoneEl.removeAttribute('aria-invalid');
    if (!email && !phone) {
      emailEl.setAttribute('aria-invalid', 'true');
      phoneEl.setAttribute('aria-invalid', 'true');
      return { ok: false, text: MESSAGES.empty, focus: emailEl };
    }
    if (email && !EMAIL_RE.test(email)) {
      emailEl.setAttribute('aria-invalid', 'true');
      return { ok: false, text: MESSAGES.email, focus: emailEl };
    }
    if (phone && !validPhone(phone)) {
      phoneEl.setAttribute('aria-invalid', 'true');
      return { ok: false, text: MESSAGES.phone, focus: phoneEl };
    }
    return { ok: true };
  }

  [emailEl, phoneEl].forEach((el) => el.addEventListener('input', () => {
    if (msg.textContent) { msg.textContent = ''; emailEl.removeAttribute('aria-invalid'); phoneEl.removeAttribute('aria-invalid'); }
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const check = validate();
    if (!check.ok) { msg.textContent = check.text; check.focus.focus(); return; }
    msg.textContent = '';
    form.classList.add('is-sending');
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      formView.hidden = true;
      successView.hidden = false;
      successView.querySelector('.modal__title').focus();
    } catch (err) {
      msg.textContent = MESSAGES.failed;
    } finally {
      form.classList.remove('is-sending');
    }
  });
})();
