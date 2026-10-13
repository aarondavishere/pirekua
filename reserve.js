/* pirekua — Reserve page (/reserve/): quantities, the running summary, the
   reservation form and its confirmation. Needs i18n.js and common.js first.
   Vanilla JS, no dependencies. */

/* ---------------- Tuning knobs ---------------- */

// The products, in page order. `field` is the hidden form field (and the Netlify
// column); `price` is per unit in dollars. Leave every price null to show no
// prices anywhere; fill them in later and the cards and summary show prices and
// a total (the "No payment today" line stays). Names stay in English, except the
// gift box, which uses gift.name / gift.short.
const PRODUCTS = [
  { id: 'gift-box',  field: 'gift_boxes', nameKey: 'gift.short', en: 'Holiday Gift Box', enPlural: 'Holiday Gift Boxes', price: null, max: 999 },
  { id: 'sweet',     field: 'sweet',      name: 'Sweet',     price: null, max: 999 },
  { id: 'smoky',     field: 'smoky',      name: 'Smoky',     price: null, max: 999 },
  { id: 'spicy',     field: 'spicy',      name: 'Spicy',     price: null, max: 999 },
  { id: 'chili-oil', field: 'chili_oil',  name: 'Chili Oil', price: null, max: 999 },
];
const BULK_NOTE_AT = 10;          // gift boxes at which the "Gifting a crowd?" note appears
const CURRENCY = 'USD';           // only used once prices are filled in
const LIVE_DELAY_MS = 600;        // quiet pause before the summary change is announced to screen readers
const DONE_DIALOG_DELAY_MS = 700; // let the confetti play before the confirmation opens (0 with reduced motion)
// ?source= values we keep; anything else is stored as "none".
const SOURCES = ['hero', 'cookbook', 'quiz', 'sweet', 'smoky', 'spicy', 'chili-oil'];
// ?add= values that start a product at 1.
const ADDABLE = ['gift-box', 'sweet', 'smoky', 'spicy', 'chili-oil'];
// "Add to basket": a small copy of the product flies from the + to the basket button.
const FLY_MS = 650;          // flight time
const FLY_ARC_PX = 90;       // how far the path rises above the straight line at its middle
const FLY_MAX_AT_ONCE = 6;   // more flights than this at once: skip the flight, just update the badge
const FLY_SIZE_PX = 52;      // height of the flying copy when it sets off
const BUMP_MS = 260;         // the basket's bump when the count changes

(() => {
  'use strict';

  const P = window.pirekua;
  const t = P.t;
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const qty = Object.fromEntries(PRODUCTS.map((p) => [p.id, 0]));

  const nameOf = (p) => (p.nameKey ? t(p.nameKey) : p.name);
  const hasPrices = () => PRODUCTS.some((p) => typeof p.price === 'number');
  const money = (n) => {
    try { return new Intl.NumberFormat(P.lang() === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: CURRENCY }).format(n); }
    catch (e) { return '$' + n.toFixed(2); }
  };
  const itemCount = () => PRODUCTS.reduce((s, p) => s + qty[p.id], 0);
  const clamp = (n, p) => Math.min(Math.max(n, 0), p.max);
  const scrollBehavior = () => (P.reduceMotion() ? 'auto' : 'smooth');

  // Production totals: each gift box holds one Sweet, one Smoky, one Spicy and an empty mixing jar.
  function totals() {
    const g = qty['gift-box'];
    return { sweet: qty.sweet + g, smoky: qty.smoky + g, spicy: qty.spicy + g, oil: qty['chili-oil'], mixing: g };
  }
  // "2 Holiday Gift Boxes, 3 Smoky, 1 Spicy": always English, for the owners (Notion, Netlify).
  function orderSummaryEn() {
    return PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => {
      const n = qty[p.id];
      return n + ' ' + (p.en ? (n === 1 ? p.en : p.enPlural) : p.name);
    }).join(', ');
  }
  // "Holiday Gift Box × 2, Smoky × 3" in the visitor's language.
  const linesNow = () => PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => ({ id: p.id, n: qty[p.id] }));
  const lineText = (l) => nameOf(byId[l.id]) + ' × ' + l.n;

  /* ---------------------------------------------------------------
     Steppers
     --------------------------------------------------------------- */
  const steppers = {};
  document.querySelectorAll('.stepper[data-product]').forEach((el) => {
    const p = byId[el.dataset.product];
    if (!p) return;
    const input = el.querySelector('.stepper__input');
    const [dec, inc] = el.querySelectorAll('.stepper__btn');
    input.max = String(p.max);
    steppers[p.id] = { el, input, dec, inc };
    dec.addEventListener('click', () => setQty(p.id, qty[p.id] - 1, { announce: true }));
    inc.addEventListener('click', () => setQty(p.id, qty[p.id] + 1, { announce: true, from: inc }));
    // Typing: digits only; empty counts as 0 while typing and shows 0 once you leave.
    input.addEventListener('keydown', (e) => {
      if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault();
    });
    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D/g, '');
      let n = digits === '' ? 0 : parseInt(digits, 10);
      if (n > p.max) { n = p.max; input.value = String(n); }
      setQty(p.id, n, { announce: true, typing: true });
    });
    // A typed number counts for the basket once it's committed (blur or Enter):
    // one flight if it went up, otherwise the badge just catches up.
    let before = 0;
    input.addEventListener('focus', () => { before = qty[p.id]; });
    const commit = () => {
      if (qty[p.id] > before) flyOrSync(p.id, input); else badge.sync();
      before = qty[p.id];
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    input.addEventListener('blur', () => { input.value = String(qty[p.id]); commit(); });
  });

  function nameSteppers() {
    PRODUCTS.forEach((p) => {
      const s = steppers[p.id];
      if (!s) return;
      s.dec.setAttribute('aria-label', t('qty.dec', { name: p.id === 'gift-box' ? t('gift.name') : p.name }));
      s.inc.setAttribute('aria-label', t('qty.inc', { name: p.id === 'gift-box' ? t('gift.name') : p.name }));
    });
  }

  /* ---------------------------------------------------------------
     Quantity → everything else
     --------------------------------------------------------------- */
  const form = document.querySelector('form[name="reservation"]');
  const liveEl = document.querySelector('[data-live]');
  const bulkEl = document.querySelector('[data-bulk]');
  const recapEl = document.querySelector('[data-recap]');
  const emptyMsg = document.getElementById('empty-msg');
  let liveTimer = 0, locked = false;

  function setQty(id, value, opts) {
    const p = byId[id];
    if (!p || locked) return;
    const n = clamp(Number.isFinite(value) ? Math.floor(value) : 0, p);
    const changed = n !== qty[id];
    const up = n > qty[id];
    qty[id] = n;
    const s = steppers[id];
    if (s && !(opts && opts.typing)) s.input.value = String(n);
    if (changed && opts && opts.announce) announce(p);
    render();
    // The badge: going up with a pressed + flies first and updates on landing;
    // typing waits for the commit; everything else updates it right away.
    if (opts && opts.typing) return;
    if (up && opts && opts.from) flyOrSync(id, opts.from);
    else badge.sync();
  }

  function announce(p) {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      liveEl.textContent = t('summary.live', { name: nameOf(p), n: qty[p.id] });
    }, LIVE_DELAY_MS);
  }

  function render() {
    // stepper buttons at the ends
    PRODUCTS.forEach((p) => {
      const s = steppers[p.id];
      if (!s) return;
      s.dec.disabled = locked || qty[p.id] <= 0;
      s.inc.disabled = locked || qty[p.id] >= p.max;
      s.input.disabled = locked;
    });
    bulkEl.hidden = qty['gift-box'] < BULK_NOTE_AT;

    // hidden form fields
    PRODUCTS.forEach((p) => { form.elements[p.field].value = String(qty[p.id]); });
    form.elements.order_summary.value = orderSummaryEn();

    // prices on the cards (only once they're set)
    document.querySelectorAll('[data-price-for]').forEach((el) => {
      const p = byId[el.dataset.priceFor];
      const show = p && typeof p.price === 'number';
      el.hidden = !show;
      if (show) el.textContent = money(p.price);
    });

    // recap above the Reserve button
    const lines = linesNow();
    recapEl.hidden = !lines.length;
    recapEl.textContent = lines.length ? t('form.recap', { summary: lines.map(lineText).join(', ') }) : '';
    if (lines.length && emptyMsg.dataset.key) showNote(emptyMsg, '');

    document.querySelectorAll('[data-summary]').forEach(renderSummary);
    document.querySelectorAll('.sheet__go').forEach((a) => { a.hidden = !lines.length; });
  }

  // The summary itself, drawn into the desktop panel and the phone sheet.
  function renderSummary(box) {
    const had = box.contains(document.activeElement) ? document.activeElement : null;
    const focusId = had && had.dataset.remove;
    box.textContent = '';
    const lines = linesNow();
    if (!lines.length) {
      box.appendChild(el('p', 'summary__empty', t('summary.empty')));
    } else {
      const ul = el('ul', 'summary__lines');
      lines.forEach((l) => {
        const p = byId[l.id];
        const li = el('li', 'summary__line');
        li.appendChild(el('span', 'summary__name', lineText(l)));
        li.appendChild(el('span', 'summary__amount', typeof p.price === 'number' ? money(p.price * l.n) : ''));
        const rm = el('button', 'link-btn summary__remove', t('summary.remove'));
        rm.type = 'button';
        rm.dataset.remove = l.id;
        rm.setAttribute('aria-label', t('summary.removeLabel', { name: nameOf(p) }));
        rm.addEventListener('click', () => removeLine(box, l.id));
        li.appendChild(rm);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      const tt = totals();
      box.appendChild(el('p', 'summary__total', t('summary.total', tt)));
      if (tt.mixing > 0) box.appendChild(el('p', 'summary__mixing', tt.mixing === 1 ? t('summary.mixing1') : t('summary.mixingN', { n: tt.mixing })));
      if (hasPrices()) {
        const sum = PRODUCTS.reduce((s, p) => s + (typeof p.price === 'number' ? p.price * qty[p.id] : 0), 0);
        box.appendChild(el('p', 'summary__price', t('summary.price', { price: money(sum) })));
      }
    }
    box.appendChild(el('p', 'summary__nopay', t('summary.noPay')));
    if (focusId) {
      const again = box.querySelector('[data-remove="' + focusId + '"]');
      if (again) again.focus();
    }
  }
  function removeLine(box, id) {
    const order = linesNow().map((l) => l.id);
    const i = order.indexOf(id);
    setQty(id, 0, { announce: true });
    // keep focus in the summary: the next line's Remove, else the previous, else the heading
    const next = order[i + 1] || order[i - 1];
    const target = next && box.querySelector('[data-remove="' + next + '"]');
    if (target) target.focus();
    else {
      const head = box.closest('dialog, .summary').querySelector('.summary__title');
      if (head) head.focus();
    }
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------------------------------------------------------
     Gift box art: the three jars stand in until assets/gift-box.png exists
     --------------------------------------------------------------- */
  const giftArt = document.querySelector('[data-gift-art]');
  const giftImg = giftArt && giftArt.querySelector('.gift__img');
  if (giftImg) {
    const loaded = () => giftArt.classList.add('has-box');
    if (giftImg.complete && giftImg.naturalWidth > 0) loaded();
    else giftImg.addEventListener('load', loaded);
  }

  /* ---------------------------------------------------------------
     Summary sheet (phones and tablets) and the "Reserve" shortcuts
     --------------------------------------------------------------- */
  const sheetEl = document.getElementById('summary-sheet');
  // While it's open the page can't scroll: pad the page by the scrollbar's width so
  // nothing behind it moves when the scrollbar goes away.
  const root = document.documentElement;
  const sheet = sheetEl && P.createDialog(sheetEl, {
    initialFocus: () => sheetEl.querySelector('.summary__title'),
    beforeOpen: () => { const sw = window.innerWidth - root.clientWidth; if (sw > 0) root.style.paddingRight = sw + 'px'; },
  });
  if (sheetEl) sheetEl.addEventListener('close', () => { root.style.paddingRight = ''; });
  const basketBtn = document.querySelector('[data-basket-btn]');
  if (basketBtn && sheet) basketBtn.addEventListener('click', () => sheet.open(basketBtn));

  const formTitle = document.getElementById('form-title');
  document.querySelectorAll('[data-go-form]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const go = () => {
      formTitle.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      formTitle.focus({ preventScroll: true });
    };
    // From the sheet: wait for it to close (closing hands focus back to "View"), then go.
    if (sheetEl && sheetEl.open) { sheetEl.addEventListener('close', go, { once: true }); sheet.close(); }
    else go();
  }));

  /* ---------------------------------------------------------------
     Basket button: pinned under the toggle, badge, bump
     --------------------------------------------------------------- */
  const badgeEl = document.querySelector('[data-basket-badge]');
  const badge = {
    shown: -1,
    // Show the current count (called on landing, or straight away when nothing flies).
    sync() {
      const n = itemCount();
      if (!basketBtn) return;
      basketBtn.setAttribute('aria-label', n === 0 ? t('basket.ariaEmpty') : n === 1 ? t('basket.ariaOne') : t('basket.aria', { n }));
      if (n === this.shown) return;
      const first = this.shown < 0;
      this.shown = n;
      badgeEl.hidden = n === 0;
      badgeEl.textContent = n > 99 ? '99+' : String(n);
      if (!first) bump();
    },
  };
  function bump() {
    if (!basketBtn) return;
    if (P.reduceMotion() || !basketBtn.animate) {      // no bump: a static highlight for a moment
      basketBtn.classList.add('is-flash');
      clearTimeout(bump.t); bump.t = setTimeout(() => basketBtn.classList.remove('is-flash'), 900);
      return;
    }
    basketBtn.querySelector('.basket-btn__icon').animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
      { duration: BUMP_MS, easing: 'ease-out' });
  }

  // Where it sits: just under the toggle; as the header scrolls away it eases up to
  // --basket-top-min. Right edge lines up with the toggle's.
  const toggleEl = document.querySelector('.lang-toggle');
  const cssPx = (name, fallback) => parseFloat(getComputedStyle(document.body).getPropertyValue(name)) || fallback;
  function placeBasket() {
    if (!basketBtn || !toggleEl) return;
    const tr = toggleEl.getBoundingClientRect();
    const minTop = cssPx('--basket-top-min', 12), under = cssPx('--basket-under', 8);
    basketBtn.style.top = 'calc(' + Math.max(minTop, tr.bottom + under) + 'px + env(safe-area-inset-top, 0px))';
    // From the left, so the right edges line up exactly whatever the scrollbar does
    basketBtn.style.right = 'auto';
    basketBtn.style.left = 'min(' + (tr.right - basketBtn.offsetWidth) + 'px, calc(100vw - ' + basketBtn.offsetWidth + 'px - env(safe-area-inset-right, 0px)))';
    duck();
  }
  // Never sit on a form field someone is typing into (phones): step aside while it overlaps.
  function duck() {
    if (!basketBtn) return;
    const f = document.activeElement;
    let hide = false;
    if (f && f.closest && f.closest('.rform__form') && f.matches('input, select, textarea')) {
      const a = f.getBoundingClientRect(), b = basketBtn.getBoundingClientRect(), m = 8;
      hide = a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m;
    }
    basketBtn.classList.toggle('is-ducked', hide);
  }
  let placeQueued = false;
  const queuePlace = () => { if (placeQueued) return; placeQueued = true; requestAnimationFrame(() => { placeQueued = false; placeBasket(); }); };
  window.addEventListener('scroll', queuePlace, { passive: true });
  window.addEventListener('resize', queuePlace);
  document.addEventListener('focusin', queuePlace);
  document.addEventListener('focusout', () => setTimeout(queuePlace));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queuePlace);

  /* ---------------------------------------------------------------
     "Add to basket": a small copy of the product flies to the basket
     --------------------------------------------------------------- */
  const FLY_ART = {
    sweet: ['/assets/jars/small/sweet-1.png'],
    smoky: ['/assets/jars/small/smoky-1.png'],
    spicy: ['/assets/jars/small/spicy-1.png'],
    'chili-oil': ['/assets/jars/oil-1.png'],
    // Until assets/gift-box.png exists, the three front jars fly as a tight cluster.
    'gift-box': ['/assets/jars/small/sweet-1.png', '/assets/jars/small/smoky-1.png', '/assets/jars/small/spicy-1.png'],
  };
  let flying = 0;
  function flyOrSync(id, fromEl) {
    if (!fly(id, fromEl)) badge.sync();
  }
  function fly(id, fromEl) {
    if (P.reduceMotion() || !basketBtn || !fromEl || flying >= FLY_MAX_AT_ONCE) return false;
    const end = basketBtn.getBoundingClientRect();
    const start = fromEl.getBoundingClientRect();
    if (!end.width || basketBtn.classList.contains('is-ducked') || !start.width) return false;
    const node = document.createElement('div');
    node.className = 'fly';
    node.setAttribute('aria-hidden', 'true');
    const box = id === 'gift-box' && giftArt && giftArt.classList.contains('has-box') ? ['/assets/gift-box.png'] : FLY_ART[id];
    if (box.length > 1) node.classList.add('fly--cluster');
    box.forEach((src) => {
      const img = document.createElement('img');
      img.alt = ''; img.src = src;
      img.onerror = () => img.remove();   // never a substitute: a missing file just doesn't fly
      node.appendChild(img);
    });
    const h = FLY_SIZE_PX;
    node.style.height = h + 'px';
    document.body.appendChild(node);
    const w = node.getBoundingClientRect().width || h * 0.7;
    const x0 = start.left + start.width / 2 - w / 2, y0 = start.top + start.height / 2 - h / 2;
    const x2 = end.left + end.width / 2 - w / 2, y2 = end.top + end.height / 2 - h / 2;
    // a gentle arc: the control point sits FLY_ARC_PX above the middle of the straight line
    const x1 = (x0 + x2) / 2, y1 = Math.min(y0, y2) - FLY_ARC_PX;
    const turn = (x2 >= x0 ? 1 : -1) * 20;
    const frames = [];
    const STEPS = 12;
    for (let i = 0; i <= STEPS; i++) {
      const u = i / STEPS, v = 1 - u;
      const x = v * v * x0 + 2 * v * u * x1 + u * u * x2;
      const y = v * v * y0 + 2 * v * u * y1 + u * u * y2;
      frames.push({
        offset: u,
        transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (turn * u).toFixed(1) + 'deg) scale(' + (1 - 0.6 * u).toFixed(3) + ')',
        opacity: u <= 0.85 ? 1 : Math.max(0, (1 - u) / 0.15),
      });
    }
    flying += 1;
    let done = false;
    const land = () => { if (done) return; done = true; flying -= 1; node.remove(); badge.sync(); };
    const anim = node.animate(frames, { duration: FLY_MS, easing: 'ease-in-out', fill: 'forwards' });
    anim.onfinish = land;
    anim.oncancel = land;
    return true;
  }

  /* ---------------------------------------------------------------
     Form: validation, sending, confirmation
     --------------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ZIP_RE = /^\d{5}(?:-?\d{4})?$/;
  const validPhone = (v) => /^[+\d\s().-]+$/.test(v) && (() => { const d = v.replace(/\D/g, '').length; return d >= 10 && d <= 15; })();
  const FIELDS = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip'];
  const alertEl = document.getElementById('form-alert');
  const sendMsg = document.getElementById('send-msg');
  const button = form.querySelector('[data-reserve]');
  const buttonLabel = button.querySelector('[data-btn-label]');
  const fieldset = form.querySelector('[data-fields]');
  let submitted = false, sending = false;

  function errorFor(name) {
    const input = form.elements[name];
    const v = String(input.value || '').trim();
    if (!v) return 'form.required';
    if (name === 'email' && (!EMAIL_RE.test(v) || v.length > 254)) return 'form.emailBad';
    if (name === 'phone' && !validPhone(v)) return 'form.phoneBad';
    if (name === 'zip' && !ZIP_RE.test(v)) return 'form.zipBad';
    return '';
  }
  function showFieldError(name, key) {
    const input = form.elements[name];
    const msg = document.getElementById(input.getAttribute('aria-describedby'));
    msg.dataset.key = key || '';
    msg.textContent = key ? t(key) : '';
    if (key) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function validateAll() {
    const bad = [];
    FIELDS.forEach((name) => {
      const key = errorFor(name);
      showFieldError(name, key);
      if (key) bad.push(form.elements[name]);
    });
    return bad;
  }
  function showAlert(n) {
    alertEl.dataset.n = String(n);
    alertEl.hidden = !n;
    alertEl.textContent = n ? (n === 1 ? t('form.fix1') : t('form.fixN', { n })) : '';
  }
  function showNote(node, key) {
    node.dataset.key = key || '';
    node.textContent = key ? t(key) : '';
  }

  FIELDS.forEach((name) => {
    const input = form.elements[name];
    // On blur: check anything typed (and everything, once they've tried to submit).
    input.addEventListener('blur', () => {
      if (sending) return;
      if (submitted || String(input.value).trim()) showFieldError(name, errorFor(name));
      if (submitted) showAlert(FIELDS.filter((f) => form.elements[f].getAttribute('aria-invalid') === 'true').length);
    });
    // While fixing a field that's marked wrong, clear the message as soon as it's right.
    const live = () => {
      if (input.getAttribute('aria-invalid') === 'true' && !errorFor(name)) {
        showFieldError(name, '');
        if (submitted) showAlert(FIELDS.filter((f) => form.elements[f].getAttribute('aria-invalid') === 'true').length);
      }
    };
    input.addEventListener('input', live);
    input.addEventListener('change', live);
  });

  function setBusy(on) {
    sending = on;
    button.setAttribute('aria-busy', on ? 'true' : 'false');
    if (on) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled');
    buttonLabel.textContent = t(on ? 'form.busy' : 'form.button');
    fieldset.disabled = on;
    locked = on;
    render();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;                         // no double submits
    submitted = true;
    showNote(sendMsg, '');
    const bad = validateAll();
    showAlert(bad.length);
    const empty = itemCount() === 0;
    showNote(emptyMsg, empty ? 'form.empty' : '');
    if (bad.length) { bad[0].focus(); return; }
    if (empty) {
      const gift = document.querySelector('.gift');
      gift.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      steppers['gift-box'].input.focus({ preventScroll: true });
      return;
    }

    form.elements.lang.value = P.lang();
    render();                                    // hidden fields up to date
    const body = new URLSearchParams(new FormData(form)).toString();   // before the fields lock
    const email = form.elements.email.value.trim();
    const lines = linesNow();
    setBusy(true);
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (err) {
      setBusy(false);
      showNote(sendMsg, 'form.error');           // everything they entered stays put
      button.focus();
      return;
    }

    // Success: confetti, then the confirmation; the page resets underneath.
    P.party(button);
    setBusy(false);
    sending = true;                              // hold until the reset below is done
    form.reset();
    PRODUCTS.forEach((p) => { qty[p.id] = 0; if (steppers[p.id]) steppers[p.id].input.value = '0'; });
    FIELDS.forEach((name) => showFieldError(name, ''));
    showAlert(0);
    submitted = false;
    form.elements.source.value = source;         // form.reset() restores the default; keep the visit's source
    render();
    badge.sync();
    sending = false;
    done.show(email, lines);
  });

  /* Reservation confirmed */
  const doneEl = document.getElementById('done-modal');
  const doneDialog = P.createDialog(doneEl, { initialFocus: () => doneEl.querySelector('.modal__title') });
  const done = {
    email: '', lines: [],
    show(email, lines) {
      this.email = email; this.lines = lines;
      this.fill();
      setTimeout(() => doneDialog.open(button), P.reduceMotion() ? 0 : DONE_DIALOG_DELAY_MS);
    },
    fill() {
      doneEl.querySelector('[data-done-text]').textContent = t('done.body', { email: this.email });
      const ul = doneEl.querySelector('[data-done-recap]');
      ul.textContent = '';
      this.lines.forEach((l) => ul.appendChild(el('li', '', lineText(l))));
    },
  };

  /* ---------------------------------------------------------------
     Language changes: redraw everything that's built in script
     --------------------------------------------------------------- */
  P.onLang(() => {
    nameSteppers();
    render();
    badge.sync();
    if (alertEl.dataset.n) showAlert(Number(alertEl.dataset.n));
    [emptyMsg, sendMsg].forEach((n) => { if (n.dataset.key) n.textContent = t(n.dataset.key); });
    form.querySelectorAll('.field__error').forEach((m) => { if (m.dataset.key) m.textContent = t(m.dataset.key); });
    buttonLabel.textContent = t(sending ? 'form.busy' : 'form.button');
    if (done.email) done.fill();
  });

  /* ---------------------------------------------------------------
     Arriving: ?source= and ?add=
     --------------------------------------------------------------- */
  const params = new URLSearchParams(window.location.search);
  const rawSource = params.get('source');
  const source = SOURCES.includes(rawSource) ? rawSource : 'none';
  form.elements.source.value = source;
  form.elements.source.defaultValue = source;
  const add = params.get('add');
  if (ADDABLE.includes(add)) setQty(add, 1);

  nameSteppers();
  render();
  badge.sync();
  placeBasket();
})();
