/* pirekua — home page interactions (ristra, carousel, quiz). Vanilla JS, no
   dependencies. Shared code lives in i18n.js and common.js, loaded first. */

/* ---------------- Tuning knobs ---------------- */

// Quiz: the result is a random whole number in this range (answers never matter).
const QUIZ_MIN = 52;
const QUIZ_MAX = 93;
// Quiz reveal timing (ms).
const DRUMROLL_MS = 2500;   // anticipation beat after "Show me my results"
const BASKET_MS = 3600;     // jars pouring into the basket (max ~4000)
const JOKE_DELAY_MS = 500;  // after the basket, the joke line fades in
const CTA_DELAY_MS = 500;   // after the joke, the party button fades in
// Quiz basket: how many jars pour in, and how many spill over the sides.
const BASKET_INSIDE_JARS = 32;
const BASKET_TUMBLERS = 8;
const BASKET_DROP_STAGGER_MS = 70;   // gap between jars landing inside
const BASKET_SEED = 7;               // change for a different (but repeatable) heap

// Cookbook carousel: one entry per page. A page shows its image when the file
// exists, otherwise its labeled placeholder. Add or remove entries freely.
const COOKBOOK_PAGES = [
  { src: 'assets/cookbook/page-1.png' },
  { src: 'assets/cookbook/page-2.png' },
  { src: 'assets/cookbook/page-3.png' },
  { src: 'assets/cookbook/page-4.png' },
  { src: 'assets/cookbook/page-5.png' },
  { src: 'assets/cookbook/page-6.png' },
];

// Jar cutouts (transparent, no shadow) in assets/jars/, named <flavor>-<angle>.png.
// -1 is always the straight-on front view. The quiz basket picks angles from these
// lists; the hero picks its angle per jar in index.html. Adding or removing an
// angle here is a one-line change. A small copy of each lives in assets/jars/small/
// (used by the hero and the basket); if it's missing, the full-size file is used.
//   2 = ¾ left, 3 = ¾ right, 4 = high angle, 5 = low angle, 6 = side (story panel), 7 = side (nutrition panel)
const JAR_ART = {
  sweet: ['assets/jars/sweet-1.png', 'assets/jars/sweet-2.png', 'assets/jars/sweet-3.png', 'assets/jars/sweet-4.png', 'assets/jars/sweet-5.png', 'assets/jars/sweet-6.png', 'assets/jars/sweet-7.png'],
  smoky: ['assets/jars/smoky-1.png', 'assets/jars/smoky-2.png', 'assets/jars/smoky-3.png', 'assets/jars/smoky-4.png', 'assets/jars/smoky-5.png', 'assets/jars/smoky-6.png', 'assets/jars/smoky-7.png'],
  spicy: ['assets/jars/spicy-1.png', 'assets/jars/spicy-2.png', 'assets/jars/spicy-3.png', 'assets/jars/spicy-4.png', 'assets/jars/spicy-5.png', 'assets/jars/spicy-6.png', 'assets/jars/spicy-7.png'],
};
// Chili Oil bottle cutouts: 1 front, 2 ¾ left, 3 ¾ right, 4 high angle, 5 back.
const OIL_ART = ['assets/jars/oil-1.png', 'assets/jars/oil-2.png', 'assets/jars/oil-3.png', 'assets/jars/oil-4.png', 'assets/jars/oil-5.png'];
const smallJar = (src) => src.replace('assets/jars/', 'assets/jars/small/');


(() => {
  'use strict';

  const P = window.pirekua;
  const t = P.t;
  const reduceMotion = P.reduceMotion;

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
    const isTouch = () => window.matchMedia('(hover: none)').matches;

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
     Product cards: each card's link is named "<product>: reserve yours"
     (product names stay in English)
     --------------------------------------------------------------- */
  const cardButtons = document.querySelectorAll('[data-card-name]');
  if (cardButtons.length) {
    const nameCards = () => cardButtons.forEach((b) => b.setAttribute('aria-label', t('products.cardLabel', { name: b.dataset.cardName })));
    P.onLang(nameCards);
  }

  /* ---------------------------------------------------------------
     Cookbook carousel (slides from COOKBOOK_PAGES)
     --------------------------------------------------------------- */
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('[data-carousel-track]');
    const dotsWrap = carousel.querySelector('[data-carousel-dots]');
    const status = carousel.querySelector('[data-carousel-status]');
    const total = COOKBOOK_PAGES.length;
    const slides = [], dots = [];
    let index = 0;

    COOKBOOK_PAGES.forEach((page, i) => {
      const n = i + 1;
      const li = document.createElement('li');
      li.className = 'carousel__slide';
      li.setAttribute('role', 'group');

      // Branded placeholder, shown until (unless) the real page loads
      const ph = document.createElement('div');
      ph.className = 'cb-page';
      ph.innerHTML =
        '<span class="cb-page__rule" aria-hidden="true"></span>' +
        '<img class="cb-page__chile" src="assets/' + ['chile-smoky', 'chile-spicy', 'chile-sweet'][i % 3] + '.png" alt="" width="132" height="240" loading="lazy" aria-hidden="true">' +
        '<img class="cb-page__leaf" src="assets/leaf-' + (i % 2 ? 2 : 1) + '.png" alt="" width="252" height="144" loading="lazy" aria-hidden="true">' +
        '<p class="cb-page__label"></p>';
      li.appendChild(ph);

      if (page.src) {
        const img = new Image();
        img.className = 'carousel__img';
        img.width = 1200; img.height = 1200;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.hidden = true;
        img.onload = () => { img.hidden = false; ph.hidden = true; };
        img.onerror = () => img.remove();
        img.src = page.src;
        li.appendChild(img);
      }
      track.appendChild(li);
      slides.push(li);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    function label() {
      slides.forEach((li, i) => {
        const vars = { n: i + 1, total };
        li.setAttribute('aria-roledescription', t('s3.slideRole'));
        li.setAttribute('aria-label', t('s3.slideOf', vars));
        li.querySelector('.cb-page__label').textContent = t('s3.slideLabel', vars);
        const img = li.querySelector('.carousel__img');
        if (img) img.alt = t('s3.slideAlt', vars);
      });
      dots.forEach((d, i) => d.setAttribute('aria-label', t('s3.dot', { n: i + 1 })));
    }
    function setIndex(i, announce) {
      if (i === index && !announce) return;
      index = i;
      dots.forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
      if (announce) status.textContent = t('s3.status', { n: i + 1, total });
    }
    // While a button-driven scroll is in flight, the scroll position is not the answer.
    let lockUntil = 0;
    function goTo(i) {
      const next = (i + total) % total;
      lockUntil = performance.now() + 700;
      track.scrollTo({ left: next * track.clientWidth, behavior: reduceMotion() ? 'auto' : 'smooth' });
      setIndex(next, true);
    }
    let scrollRaf = 0;
    track.addEventListener('scroll', () => {
      if (performance.now() < lockUntil) return;
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i !== index) setIndex(Math.max(0, Math.min(total - 1, i)), true);
      });
    }, { passive: true });

    carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => goTo(index - 1));
    carousel.querySelector('[data-carousel-next]').addEventListener('click', () => goTo(index + 1));
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    });
    track.tabIndex = 0;

    label();
    setIndex(0, false);
    dots[0] && dots[0].setAttribute('aria-current', 'true');
    P.onLang(() => { label(); });
  }

  /* ---------------------------------------------------------------
     Quiz: "How much should I get?" (answers never matter)
     --------------------------------------------------------------- */
  const quizForm = document.querySelector('[data-quiz-form]');
  const stage = document.querySelector('[data-quiz-stage]');
  if (quizForm && stage) {
    const idle = stage.querySelector('.stage__idle');
    const showBtn = stage.querySelector('[data-quiz-show]');
    const numberEl = stage.querySelector('[data-quiz-number]');
    const jarsEl = stage.querySelector('[data-basket-jars]');     // inside the basket: clipped at the rim
    const spillEl = stage.querySelector('[data-basket-spill]') || jarsEl;   // tumblers: never clipped
    const joke = stage.querySelector('.stage__joke');
    const cta = stage.querySelector('.stage__cta');
    const again = stage.querySelector('[data-quiz-again]');
    const status = stage.querySelector('[data-quiz-status]');
    const slider = quizForm.elements.q2;
    const sliderOut = quizForm.querySelector('[data-quiz-pushups-out]');
    const q3Faces = Array.from(quizForm.querySelectorAll('[data-q3-face]'));
    let sliderMoved = false;
    let timers = [];
    let anims = [];
    let resultN = 0;

    const answered = () => !!quizForm.elements.q1.value && sliderMoved && !!quizForm.elements.q3.value;
    function refresh() {
      const ready = answered();
      showBtn.disabled = !ready;
      idle.classList.toggle('is-ready', ready);
    }
    function paintSlider() {
      const v = Number(slider.value), max = Number(slider.max);
      sliderOut.textContent = v >= max ? max + '+' : String(v);
      slider.style.setProperty('--pct', (v / max * 100) + '%');
      slider.setAttribute('aria-valuetext', t('quiz.q2Value', { n: v >= max ? max + '+' : v }));
    }
    function paintQ3() {
      // The joke: whatever you pick, it says yes.
      q3Faces.forEach((face) => {
        const input = face.previousElementSibling;
        face.textContent = input.checked ? t('quiz.q3yes') : t(face.dataset.q3Face);
      });
    }
    quizForm.addEventListener('submit', (e) => e.preventDefault());
    quizForm.addEventListener('change', () => { paintQ3(); refresh(); });
    slider.addEventListener('input', () => { sliderMoved = true; paintSlider(); refresh(); });
    P.onLang(() => {
      paintSlider();
      paintQ3();
      if (stage.dataset.state === 'result') status.textContent = t('quiz.result', { n: resultN });
    });

    const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

    // Basket choreography in a 280 × 250 scene (basket: 200 × 172 at the bottom,
    // rim band top at y 134, rim from x 54 to 226). Positions are generated once
    // from a fixed seed, so every run looks the same. Jars stack in rows that
    // narrow into a heap above the rim; the last few tumble over the sides.
    const FLAVORS = ['sweet', 'smoky', 'spicy'];
    const SCENE = { w: 280, h: 250, rimY: 134, rimL: 54, rimR: 226, jarW: 26, jarH: 35 };

    function seeded(seed) {           // mulberry32
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let x = Math.imul(a ^ (a >>> 15), 1 | a);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    }
    function buildHeap() {
      const rnd = seeded(BASKET_SEED);
      const jit = (n) => (rnd() * 2 - 1) * n;
      const inside = [];
      // Rows from the bottom up: each row a little narrower and higher.
      const rows = [];
      let left = BASKET_INSIDE_JARS, cap = 8;
      while (left > 0) { const n = Math.min(cap, left); rows.push(n); left -= n; cap = Math.max(2, cap - 1); }
      rows.forEach((n, r) => {
        const half = Math.max(16, ((SCENE.rimR - SCENE.rimL) / 2 - 20) - r * 9);   // stays inside the rim
        const cx = SCENE.w / 2, cy = SCENE.rimY + 10 - r * 19;
        for (let k = 0; k < n; k++) {
          const x = n === 1 ? cx : cx - half + (2 * half) * (k / (n - 1));
          inside.push({ x: x + jit(4), y: cy + jit(3), r: jit(15) });
        }
      });
      // Tumblers rest on the floor beside the basket, a few stacked on top.
      const spots = [
        [24, 236, -88], [256, 236, 90], [48, 237, -96], [232, 237, 84],
        [36, 214, -80], [244, 214, 100], [16, 214, -104], [264, 214, 76],
      ];
      const tumblers = [];
      for (let k = 0; k < BASKET_TUMBLERS; k++) {
        const [fx, fy, fr] = spots[k % spots.length];
        const dir = fx < SCENE.w / 2 ? -1 : 1;
        tumblers.push({
          x: fx + jit(3), y: fy + jit(2), r: fr + jit(8), dir,
          pile: [SCENE.w / 2 + jit(14), 34 + jit(6)],                    // lands on top of the heap
          rim: [dir < 0 ? SCENE.rimL - 6 : SCENE.rimR + 6, SCENE.rimY - 18], // rolls over the rim
        });
      }
      return { inside, tumblers };
    }
    const HEAP = buildHeap();

    // Each jar gets a flavor (cycling) and an angle from JAR_ART, chosen once from
    // the seed, so the heap looks varied but is the same on every run.
    const pickRnd = seeded(BASKET_SEED + 101);
    const TOTAL_JARS = BASKET_INSIDE_JARS + BASKET_TUMBLERS;
    const JAR_PICKS = Array.from({ length: TOTAL_JARS }, (_, i) => {
      const f = FLAVORS[i % 3];
      const list = JAR_ART[f] || [];
      return { f, src: list.length ? list[Math.floor(pickRnd() * list.length)] : '' };
    });

    function makeJar(i, cx, cy, layer) {
      const pick = JAR_PICKS[i % JAR_PICKS.length];
      const el = document.createElement('div');
      el.className = 'minijar';
      el.style.left = (cx - SCENE.jarW / 2) + 'px';
      el.style.top = (cy - SCENE.jarH / 2) + 'px';
      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      // small cutout → full-size cutout → studio render with the old crop
      const chain = [pick.src && smallJar(pick.src), pick.src, 'assets/render-' + pick.f + '.png'].filter(Boolean);
      let k = 0;
      img.onerror = () => {
        k += 1;
        if (k >= chain.length) { img.onerror = null; return; }
        if (k === chain.length - 1) el.classList.add('is-fallback');
        img.src = chain[k];
      };
      if (chain.length === 1) el.classList.add('is-fallback');
      img.src = chain[0];
      el.appendChild(img);
      (layer || jarsEl).appendChild(el);
      return el;
    }
    function playBasket(instant) {
      jarsEl.textContent = '';
      spillEl.textContent = '';
      HEAP.inside.forEach((p, i) => {
        const el = makeJar(i, p.x, p.y);
        el.style.transform = 'rotate(' + p.r.toFixed(1) + 'deg)';
        if (instant || !el.animate) return;
        anims.push(el.animate([
          { transform: 'translateY(' + (-p.y - 60) + 'px) rotate(' + (p.r - 30).toFixed(1) + 'deg)', opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: 'translateY(0) rotate(' + p.r.toFixed(1) + 'deg)', opacity: 1 },
        ], { duration: 420, delay: i * BASKET_DROP_STAGGER_MS, easing: 'cubic-bezier(.3,1.3,.6,1)', fill: 'both' }));
      });
      // Tumblers start once the heap is mostly built and finish inside BASKET_MS.
      const tumbleDur = 1000;
      const tumbleStart = Math.max(0, BASKET_MS - tumbleDur - 140 * (HEAP.tumblers.length - 1) - 120);
      HEAP.tumblers.forEach((p, k) => {
        const el = makeJar(BASKET_INSIDE_JARS + k, p.x, p.y, spillEl);
        el.classList.add('is-tumbler');
        el.style.transform = 'rotate(' + p.r.toFixed(1) + 'deg)';
        if (instant || !el.animate) return;
        const off = (pt) => [pt[0] - p.x, pt[1] - p.y];
        const pile = off(p.pile), rim = off(p.rim);
        const tr = (xy, r) => 'translate(' + xy[0].toFixed(1) + 'px,' + xy[1].toFixed(1) + 'px) rotate(' + r.toFixed(1) + 'deg)';
        anims.push(el.animate([
          { transform: tr([pile[0], pile[1] - 120], 0), opacity: 0 },
          { transform: tr(pile, 0), opacity: 1, offset: 0.28, easing: 'ease-in' },
          { transform: tr([pile[0] + p.dir * 10, pile[1] + 4], p.dir * 20), offset: 0.44, easing: 'ease-in' },
          { transform: tr(rim, p.dir * 60), offset: 0.68, easing: 'cubic-bezier(.4,0,.8,.6)' },
          { transform: tr([0, 0], p.r), opacity: 1 },
        ], { duration: tumbleDur, delay: tumbleStart + k * 140, fill: 'both' }));
      });
    }

    function reveal() {
      const instant = reduceMotion();
      resultN = QUIZ_MIN + Math.floor(Math.random() * (QUIZ_MAX - QUIZ_MIN + 1));
      numberEl.textContent = String(resultN);
      stage.dataset.state = 'result';
      status.textContent = t('quiz.result', { n: resultN });
      playBasket(instant);
      if (instant) {
        joke.classList.add('is-in');
        cta.classList.add('is-in');
        return;
      }
      later(() => joke.classList.add('is-in'), BASKET_MS + JOKE_DELAY_MS);
      later(() => cta.classList.add('is-in'), BASKET_MS + JOKE_DELAY_MS + CTA_DELAY_MS);
    }

    showBtn.addEventListener('click', () => {
      if (!answered()) return;
      if (reduceMotion()) { reveal(); again.focus(); return; }
      stage.dataset.state = 'leaving';
      later(() => {
        stage.dataset.state = 'drum';
        status.textContent = t('quiz.counting');
        stage.focus({ preventScroll: true });
        later(reveal, DRUMROLL_MS);
      }, 300);
    });

    again.addEventListener('click', () => {
      timers.forEach(clearTimeout); timers = [];
      anims.forEach((a) => a.cancel()); anims = [];
      jarsEl.textContent = '';
      spillEl.textContent = '';
      joke.classList.remove('is-in');
      cta.classList.remove('is-in');
      numberEl.textContent = '';
      status.textContent = '';
      quizForm.reset();
      sliderMoved = false;
      paintSlider();
      paintQ3();
      refresh();
      stage.dataset.state = 'idle';
      const first = quizForm.querySelector('input');
      if (first) first.focus();
    });

    stage.tabIndex = -1;
    paintSlider();
    refresh();
  }
})();
