/* pirekua — site interactions. Vanilla JS, no dependencies. */

/* ---------------- Tuning knobs ---------------- */

// Quiz: the result is a random whole number in this range (answers never matter).
const QUIZ_MIN = 52;
const QUIZ_MAX = 93;
// Quiz reveal timing (ms).
const DRUMROLL_MS = 2500;   // anticipation beat after "Show me my results"
const BASKET_MS = 2500;     // jars dumping into the basket
const JOKE_DELAY_MS = 500;  // after the basket, the joke line fades in
const CTA_DELAY_MS = 500;   // after the joke, the party button fades in

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

// Language stored on this device.
const LANG_STORAGE_KEY = 'pirekua-lang';

/* ---------------- Strings (English + Spanish) ----------------
   HTML elements point at these keys with:
     data-i18n="key"               → sets the element's text
     data-i18n-html="key"          → sets inner HTML (for strings with markup)
     data-i18n-attr="alt:key;…"    → sets attributes (alt, aria-label, content…)
   "{n}" style tokens are filled in by script. Every key needs en and es.
   Never translated: the tagline "Made with amor y risas.", the name pirekua, the lockup. */
const I18N = {
  en: {
    'meta.title': 'pirekua · Mexican chili crisp',
    'meta.description': 'pirekua Mexican chili crisp. Made with amor y risas. Sign up to be in the know.',
    'lang.group': 'Language',
    'lockup.alt': 'pirekua, Mexican chili crisp',
    'hero.sub': 'It started with two friends, a stove, and a lot of laughing.',
    'cta.know': 'Be in the know',

    's1.title': 'What is Mexican chili crisp?',
    's1.body': "It's salsa macha's cooler cousin: dried chiles, nuts, and seeds in a rich, crunchy oil. Spoonable heat you drizzle, dunk, and pile onto everything.",
    's1.lineupAlt': 'Three jars of pirekua Mexican chili crisp side by side: Sweet in a yellow label, Smoky in orange, and Spicy in red',
    's1.oilAlt': 'A squeeze bottle of pirekua Mexican Chili Oil with a deep brown label',

    's2.titleA': 'What does it taste like?',
    's2.bodyA': "Toasty, nutty, a little smoky. Unexpected but familiar. You'll swear you've had it before, then realize you haven't.",
    's2.titleB': 'Not your usual chili crisp.',
    's2.bodyB': 'Same crunch, different soul. Ours leans on Mexican chiles, nuts, and seeds: warmer and earthier, less salty-umami, more cocina. If Asian chili crisp is all about that savory, garlicky punch, ours is toastier and a little sweeter, built on the flavors of a Mexican kitchen.',
    's2.mediaAlt': 'Mexican chili crisp being made in a home kitchen',
    's2.chip': '[PLACEHOLDER: real footage of the chili crisp being made, coming in November]',

    'products.title': 'Meet the lineup',
    'products.sweet.tag': 'Toasty chiles with a warm, honeyed finish.',
    'products.sweet.desc': 'The one that surprises people. Mellow heat, a little sweetness, and that nutty crunch underneath. Hard to stop at one spoonful.',
    'products.sweet.alt': 'A jar of pirekua Sweet Mexican chili crisp',
    'products.smoky.tag': 'Deep, roasty, a little moody.',
    'products.smoky.desc': 'The chiles do the talking here: low heat, big smoke, like something pulled straight off the comal. Made for eggs, beans, and anything grilled.',
    'products.smoky.alt': 'A jar of pirekua Smoky Mexican chili crisp',
    'products.spicy.tag': 'The bold one.',
    'products.spicy.desc': "Real heat, but still toasty and nutty underneath, so it's flavor first and fire second. For the people who reach for the hot sauce before they've even tasted the food.",
    'products.spicy.alt': 'A jar of pirekua Spicy Mexican chili crisp',
    'products.oil.tag': 'All the flavor of the crisp, none of the crunch.',
    'products.oil.desc': 'Just a rich, chile-infused oil you drizzle at the end. A little goes everywhere: eggs, pizza, soup, a plate of avocado. Your hot honey, but make it Mexican.',
    'products.oil.alt': 'A squeeze bottle of pirekua Mexican Chili Oil',
    'products.heat.none': 'Heat: none',
    'products.heat.medium': 'Heat: medium',
    'products.heat.high': 'Heat: high',
    'products.cardLabel': '{name}: be in the know',

    's3.title': 'What do I use it for?',
    's3.body': "Eggs, tacos, pizza, noodles, avocado toast. Anything that could use a little más. If it's food, it probably works.",
    's3.button': 'Get the cookbook',
    's3.roledesc': 'carousel',
    's3.slideRole': 'slide',
    's3.carouselLabel': 'Cookbook pages',
    's3.prev': 'Previous page',
    's3.next': 'Next page',
    's3.dot': 'Go to page {n}',
    's3.slideLabel': 'Cookbook image {n}',
    's3.slideAlt': 'Cookbook page {n}',
    's3.slideOf': '{n} of {total}',
    's3.status': 'Slide {n} of {total}',

    's4.title': 'How much should I get?',
    'quiz.q1': 'Do you like sunrises or sunsets?',
    'quiz.q1a': 'Sunrise',
    'quiz.q1b': 'Sunset',
    'quiz.q2': 'How many push-ups can you honestly do?',
    'quiz.q2Value': '{n} push-ups',
    'quiz.q3': 'Ready for your new favorite kitchen essential?',
    'quiz.q3yes': 'Yes!',
    'quiz.q3no': 'Absolutely not',
    'quiz.q3maybe': 'Maybe',
    'quiz.show': 'Show me my results',
    'quiz.helper': 'Answer all three first.',
    'quiz.counting': 'Counting your jars…',
    'quiz.label': 'jars of pirekua Mexican chili crisp',
    'quiz.result': '{n} jars of pirekua Mexican chili crisp. Just joking, but it really is that good!',
    'quiz.joke': 'Just joking, but it really is that good!',
    'quiz.again': 'Go again',

    's5.title': 'What is special about pirekua?',
    's5.body': '[STORY COPY: to be written with Emma]',
    's5.photo': '[PHOTO: Emma and her friend in the kitchen]',

    'footer.website': '[WEBSITE URL]',
    'footer.social': '[@SOCIAL]',
    'footer.privacy': 'Privacy Policy',

    'modal.close': 'Close',
    'modal.title': 'Be in the know',
    'modal.email': 'Email',
    'modal.phone': 'Phone',
    'modal.hint': 'Either one works.',
    'modal.submit': 'Count me in',
    'modal.consent': 'By signing up, you agree to receive emails and texts from pirekua. Unsubscribe anytime. Message and data rates may apply.',
    'modal.success': "You're on the list.",
    'msg.empty': 'Add an email or a phone number so we can reach you.',
    'msg.email': 'That email looks a little off. Mind checking it?',
    'msg.phone': 'That number looks a little off. Mind checking it?',
    'msg.failed': 'Something got lost on the way. Give it another try in a moment.',

    'privacy.title': 'Privacy Policy',
    'privacy.updated': 'Last updated: [DATE]',
    'privacy.collectH': 'What we collect.',
    'privacy.collect': "If you sign up on this site, we collect the email address and/or phone number you enter, and which part of the site you signed up from. That's it.",
    'privacy.useH': 'How we use it.',
    'privacy.use': "We use it to send you a welcome email and occasional news from pirekua, such as when jars are ready, new flavors and recipes. If you give us a phone number, we may text you the same kind of news. We don't send much, and we're not here to spam you.",
    'privacy.whoH': 'Who sees it.',
    'privacy.who': "We don't sell or rent your information. It's stored with our website host (Netlify) and, for email, sent through our email provider (Resend) so we can deliver messages to you.",
    'privacy.choicesH': 'Your choices.',
    'privacy.choices': 'You can opt out of emails or texts at any time by replying "stop" or by contacting us, and we\'ll remove you. You can also ask us to delete your information.',
    'privacy.cookiesH': 'Cookies and tracking.',
    'privacy.cookies': "This site doesn't use advertising or tracking cookies. If you choose a language, your browser remembers that choice on your device.",
    'privacy.kidsH': 'Kids.',
    'privacy.kids': "This site isn't meant for children under 13.",
    'privacy.contactH': 'Contact.',
    'privacy.contact': '[CONTACT EMAIL]',
  },

  es: {
    'meta.title': 'pirekua · chili crisp mexicano',
    'meta.description': 'Chili crisp mexicano pirekua. Made with amor y risas. Regístrate para enterarte primero.',
    'lang.group': 'Idioma',
    'lockup.alt': 'pirekua, chili crisp mexicano',
    'hero.sub': 'Todo empezó con dos amigos, una estufa y un montón de risas.',
    'cta.know': 'Mantente al tanto',

    's1.title': '¿Qué es el chili crisp mexicano?',
    's1.body': 'Es el primo más buena onda de la salsa macha: chiles secos, nueces y semillas en un aceite rico y crujiente. Picor para cucharear que rocías, remojas y le echas a todo.',
    's1.lineupAlt': 'Tres frascos de chili crisp mexicano pirekua lado a lado: Sweet con etiqueta amarilla, Smoky en naranja y Spicy en rojo',
    's1.oilAlt': 'Una botella exprimible de Chili Oil mexicano pirekua con etiqueta café oscuro',

    's2.titleA': '¿A qué sabe?',
    's2.bodyA': 'Tostado, con sabor a nuez, un poco ahumado. Inesperado pero familiar. Jurarías que ya lo habías probado, hasta que te das cuenta de que no.',
    's2.titleB': 'No es el chili crisp de siempre.',
    's2.bodyB': 'Mismo crunch, distinta alma. El nuestro se apoya en chiles, nueces y semillas mexicanos: más cálido y terroso, menos salado y umami, más cocina. Si el chili crisp asiático es puro golpe sabroso y ajoso, el nuestro es más tostado y un poquito más dulce, hecho con los sabores de una cocina mexicana.',
    's2.mediaAlt': 'Chili crisp mexicano preparándose en una cocina casera',
    's2.chip': '[MARCADOR: video real de cómo se hace el chili crisp, llega en noviembre]',

    'products.title': 'Conoce la línea',
    'products.sweet.tag': 'Chiles tostados con un final cálido y meloso.',
    'products.sweet.desc': 'El que sorprende a todos. Picor suave, un poquito de dulzura y ese crunch de nuez por debajo. Difícil parar en una sola cucharada.',
    'products.sweet.alt': 'Un frasco de chili crisp mexicano pirekua Sweet',
    'products.smoky.tag': 'Profundo, tostado y un poquito temperamental.',
    'products.smoky.desc': 'Aquí hablan los chiles: poco picor, mucho humo, como recién salido del comal. Hecho para huevos, frijoles y todo lo que va a la parrilla.',
    'products.smoky.alt': 'Un frasco de chili crisp mexicano pirekua Smoky',
    'products.spicy.tag': 'El atrevido.',
    'products.spicy.desc': 'Picor de verdad, pero con ese fondo tostado y de nuez: primero el sabor, luego el fuego. Para quienes buscan la salsa picante antes de probar la comida.',
    'products.spicy.alt': 'Un frasco de chili crisp mexicano pirekua Spicy',
    'products.oil.tag': 'Todo el sabor del crisp, nada del crunch.',
    'products.oil.desc': 'Solo un aceite rico, infusionado con chiles, que rocías al final. Un poquito va con todo: huevos, pizza, sopa, un plato de aguacate. Tu miel picante, pero en versión mexicana.',
    'products.oil.alt': 'Una botella exprimible de Chili Oil mexicano pirekua',
    'products.heat.none': 'Picor: nulo',
    'products.heat.medium': 'Picor: medio',
    'products.heat.high': 'Picor: alto',
    'products.cardLabel': '{name}: mantente al tanto',

    's3.title': '¿Para qué lo uso?',
    's3.body': 'Huevos, tacos, pizza, fideos, pan tostado con aguacate. Todo lo que merezca un poquito más. Si es comida, seguro funciona.',
    's3.button': 'Consigue el recetario',
    's3.roledesc': 'carrusel',
    's3.slideRole': 'diapositiva',
    's3.carouselLabel': 'Páginas del recetario',
    's3.prev': 'Página anterior',
    's3.next': 'Página siguiente',
    's3.dot': 'Ir a la página {n}',
    's3.slideLabel': 'Imagen del recetario {n}',
    's3.slideAlt': 'Página {n} del recetario',
    's3.slideOf': '{n} de {total}',
    's3.status': 'Diapositiva {n} de {total}',

    's4.title': '¿Cuántos debo llevar?',
    'quiz.q1': '¿Te gustan más los amaneceres o los atardeceres?',
    'quiz.q1a': 'Amanecer',
    'quiz.q1b': 'Atardecer',
    'quiz.q2': '¿Cuántas lagartijas puedes hacer, de verdad?',
    'quiz.q2Value': '{n} lagartijas',
    'quiz.q3': '¿Listo para tu nuevo básico favorito de la cocina?',
    'quiz.q3yes': '¡Sí!',
    'quiz.q3no': 'Para nada',
    'quiz.q3maybe': 'Quizás',
    'quiz.show': 'Muéstrame mis resultados',
    'quiz.helper': 'Primero contesta las tres.',
    'quiz.counting': 'Contando tus frascos…',
    'quiz.label': 'frascos de chili crisp mexicano pirekua',
    'quiz.result': '{n} frascos de chili crisp mexicano pirekua. Es broma, ¡pero de verdad está así de rico!',
    'quiz.joke': 'Es broma, ¡pero de verdad está así de rico!',
    'quiz.again': 'Otra vez',

    's5.title': '¿Qué tiene de especial pirekua?',
    's5.body': '[TEXTO DE LA HISTORIA: por escribir con Emma]',
    's5.photo': '[FOTO: Emma con su amigo/a en la cocina]',

    'footer.website': '[URL DEL SITIO WEB]',
    'footer.social': '[@REDES SOCIALES]',
    'footer.privacy': 'Política de privacidad',

    'modal.close': 'Cerrar',
    'modal.title': 'Mantente al tanto',
    'modal.email': 'Correo electrónico',
    'modal.phone': 'Teléfono',
    'modal.hint': 'Con uno basta.',
    'modal.submit': 'Cuenta conmigo',
    'modal.consent': 'Al registrarte, aceptas recibir correos y mensajes de texto de pirekua. Puedes darte de baja cuando quieras. Pueden aplicar tarifas de mensajes y datos.',
    'modal.success': 'Ya estás en la lista.',
    'msg.empty': 'Agrega un correo o un teléfono para que podamos contactarte.',
    'msg.email': 'Ese correo se ve medio raro. ¿Lo revisas?',
    'msg.phone': 'Ese número se ve medio raro. ¿Lo revisas?',
    'msg.failed': 'Algo se perdió en el camino. Inténtalo de nuevo en un momento.',

    'privacy.title': 'Política de privacidad',
    'privacy.updated': 'Última actualización: [FECHA]',
    'privacy.collectH': 'Qué recopilamos.',
    'privacy.collect': 'Si te registras en este sitio, recopilamos el correo electrónico y/o el número de teléfono que escribas, y desde qué parte del sitio te registraste. Eso es todo.',
    'privacy.useH': 'Cómo lo usamos.',
    'privacy.use': 'Lo usamos para enviarte un correo de bienvenida y noticias ocasionales de pirekua, como cuando los frascos estén listos, nuevos sabores y recetas. Si nos das un número de teléfono, podemos enviarte el mismo tipo de noticias por mensaje de texto. No enviamos mucho y no estamos aquí para llenarte de spam.',
    'privacy.whoH': 'Quién lo ve.',
    'privacy.who': 'No vendemos ni rentamos tu información. Se guarda con nuestro proveedor de hosting (Netlify) y, en el caso del correo, se envía a través de nuestro proveedor de correo (Resend) para poder hacerte llegar los mensajes.',
    'privacy.choicesH': 'Tus opciones.',
    'privacy.choices': 'Puedes dejar de recibir correos o mensajes de texto en cualquier momento respondiendo "stop" o contactándonos, y te daremos de baja. También puedes pedirnos que borremos tu información.',
    'privacy.cookiesH': 'Cookies y rastreo.',
    'privacy.cookies': 'Este sitio no usa cookies de publicidad ni de rastreo. Si eliges un idioma, tu navegador recuerda esa elección en tu dispositivo.',
    'privacy.kidsH': 'Niños.',
    'privacy.kids': 'Este sitio no está pensado para menores de 13 años.',
    'privacy.contactH': 'Contacto.',
    'privacy.contact': '[CORREO DE CONTACTO]',
  },
};

(() => {
  'use strict';

  const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = () => reduceMotionMQ.matches;

  /* ---------------------------------------------------------------
     i18n
     --------------------------------------------------------------- */
  let lang = 'en';
  const langListeners = [];
  function t(key, vars) {
    let s = (I18N[lang] && I18N[lang][key]);
    if (s == null) {
      console.warn('[i18n] missing "' + key + '" for ' + lang);
      s = I18N.en[key];
      if (s == null) return '';
    }
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }
  function applyLang(next) {
    lang = I18N[next] ? next : 'en';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    langListeners.forEach((fn) => fn(lang));
  }
  function readStoredLang() {
    try { return window.localStorage.getItem(LANG_STORAGE_KEY); } catch (e) { return null; }
  }
  function storeLang(value) {
    try { window.localStorage.setItem(LANG_STORAGE_KEY, value); } catch (e) { /* private mode: fine */ }
  }

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
     Dialogs (signup + privacy): focus trap, Escape and backdrop
     close, focus returns to the button that opened it
     --------------------------------------------------------------- */
  function createDialog(dialog, opts) {
    let opener = null;
    const getFocusables = () => Array.from(dialog.querySelectorAll(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.disabled && el.offsetParent !== null && !el.closest('.signup__hp'));

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

  /* ---------------- Signup modal (any [data-signup] button) ---------------- */
  const modal = document.getElementById('signup-modal');
  if (modal) {
    const form = modal.querySelector('form');
    const formView = modal.querySelector('[data-form-view]');
    const successView = modal.querySelector('[data-success-view]');
    const msg = modal.querySelector('#signup-msg');
    const emailEl = form.elements.email;
    const phoneEl = form.elements.phone;

    const showMsg = (key) => { msg.dataset.key = key || ''; msg.textContent = key ? t(key) : ''; };
    langListeners.push(() => { if (msg.dataset.key) msg.textContent = t(msg.dataset.key); });

    function resetForm() {
      form.reset();
      form.classList.remove('is-sending');
      showMsg('');
      [emailEl, phoneEl].forEach((el) => el.removeAttribute('aria-invalid'));
      formView.hidden = false;
      successView.hidden = true;
    }

    const signup = createDialog(modal, {
      beforeOpen: (trigger) => {
        if (successView.hidden === false) resetForm();
        form.elements.source.value = (trigger && trigger.dataset.source) || 'unknown';
        form.elements.lang.value = lang;
      },
      initialFocus: () => emailEl,
    });

    document.querySelectorAll('[data-signup]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('data-party') && !reduceMotion()) {
          partyBurst(btn);
          setTimeout(() => signup.open(btn), 400);
        } else {
          signup.open(btn);
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
        return { ok: false, key: 'msg.empty', focus: emailEl };
      }
      if (email && !EMAIL_RE.test(email)) {
        emailEl.setAttribute('aria-invalid', 'true');
        return { ok: false, key: 'msg.email', focus: emailEl };
      }
      if (phone && !validPhone(phone)) {
        phoneEl.setAttribute('aria-invalid', 'true');
        return { ok: false, key: 'msg.phone', focus: phoneEl };
      }
      return { ok: true };
    }

    [emailEl, phoneEl].forEach((el) => el.addEventListener('input', () => {
      if (msg.textContent) { showMsg(''); emailEl.removeAttribute('aria-invalid'); phoneEl.removeAttribute('aria-invalid'); }
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const check = validate();
      if (!check.ok) { showMsg(check.key); check.focus.focus(); return; }
      showMsg('');
      form.elements.lang.value = lang;
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
        showMsg('msg.failed');
      } finally {
        form.classList.remove('is-sending');
      }
    });
  }


  /* ---------------------------------------------------------------
     Product cards: each card's button is named "<product>: be in the know"
     (product names stay in English)
     --------------------------------------------------------------- */
  const cardButtons = document.querySelectorAll('[data-card-name]');
  if (cardButtons.length) {
    const nameCards = () => cardButtons.forEach((b) => b.setAttribute('aria-label', t('products.cardLabel', { name: b.dataset.cardName })));
    langListeners.push(nameCards);
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
    langListeners.push(() => { label(); });
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
    const jarsEl = stage.querySelector('[data-basket-jars]');
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
    langListeners.push(() => {
      paintSlider();
      paintQ3();
      if (stage.dataset.state === 'result') status.textContent = t('quiz.result', { n: resultN });
    });

    const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

    // Basket choreography in a 280 × 210 scene. Jars land inside, pile up past
    // the rim, and two tumble over the edge to rest beside the basket.
    const JAR_ART = ['assets/render-sweet.png', 'assets/render-smoky.png', 'assets/render-spicy.png'];
    const INSIDE = [
      { x: 83,  y: 88, r: -6 }, { x: 125, y: 90, r: 4 },  { x: 167, y: 88, r: -3 },
      { x: 93,  y: 66, r: -9 }, { x: 127, y: 68, r: 6 },  { x: 161, y: 66, r: -4 },
      { x: 109, y: 45, r: 11 }, { x: 145, y: 46, r: -12 },
    ];
    const TUMBLERS = [
      { x: 15,  y: 174.5, r: -90, pile: [105, -152.5], rim: [30, -104.5], dir: -1, delay: 1180 },
      { x: 237, y: 174.5, r: 96,  pile: [-97, -150.5], rim: [-32, -102.5], dir: 1, delay: 1400 },
    ];
    function makeJar(i, x, y) {
      const el = document.createElement('div');
      el.className = 'minijar';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      const img = document.createElement('img');
      img.src = JAR_ART[i % 3];
      img.alt = '';
      img.width = 720; img.height = 900;
      el.appendChild(img);
      jarsEl.appendChild(el);
      return el;
    }
    function playBasket(instant) {
      jarsEl.textContent = '';
      INSIDE.forEach((p, i) => {
        const el = makeJar(i, p.x, p.y);
        el.style.transform = 'rotate(' + p.r + 'deg)';
        if (instant || !el.animate) return;
        anims.push(el.animate([
          { transform: 'translateY(-200px) rotate(' + (p.r - 24) + 'deg)', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'translateY(0) rotate(' + p.r + 'deg)', opacity: 1 },
        ], { duration: 520, delay: i * 140, easing: 'cubic-bezier(.3,1.35,.6,1)', fill: 'both' }));
      });
      TUMBLERS.forEach((p, i) => {
        const el = makeJar(i + 1, p.x, p.y);
        el.classList.add('is-tumbler');
        el.style.transform = 'rotate(' + p.r + 'deg)';
        if (instant || !el.animate) return;
        const tr = (xy, r) => 'translate(' + xy[0] + 'px,' + xy[1] + 'px) rotate(' + r + 'deg)';
        anims.push(el.animate([
          { transform: tr([p.pile[0], p.pile[1] - 200], 0), opacity: 0 },
          { transform: tr(p.pile, 0), opacity: 1, offset: 0.26, easing: 'ease-in-out' },
          { transform: tr([p.pile[0] + p.dir * 8, p.pile[1] - 4], p.dir * 14), offset: 0.42, easing: 'ease-in' },
          { transform: tr(p.rim, p.dir * 55), offset: 0.66, easing: 'cubic-bezier(.4,0,.8,.6)' },
          { transform: tr([0, 0], p.r), opacity: 1 },
        ], { duration: 1100, delay: p.delay, fill: 'both' }));
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

  /* ---------------------------------------------------------------
     Language toggle (EN | ES), remembered on this device
     --------------------------------------------------------------- */
  const toggle = document.querySelector('.lang-toggle');
  if (toggle) {
    toggle.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.lang === lang) return;
      applyLang(b.dataset.lang);
      storeLang(lang);
    }));
    // On phones (CSS limits tucking to narrow screens): tuck the toggle away while
    // scrolling down, bring it back on the way up, and tuck it again after a short
    // pause so it never sits over content. At the top of the page it always shows.
    let lastY = window.scrollY, idleTimer = 0;
    const setTucked = (on) => toggle.classList.toggle('is-tucked', on && !toggle.contains(document.activeElement));
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      setTucked(y > 140 && y > lastY);
      lastY = y;
      clearTimeout(idleTimer);
      if (y > 140) idleTimer = setTimeout(() => setTucked(true), 2500);
    }, { passive: true });
    toggle.addEventListener('focusin', () => toggle.classList.remove('is-tucked'));
  }

  const stored = readStoredLang();
  applyLang(stored === 'es' || stored === 'en' ? stored : 'en');
})();
