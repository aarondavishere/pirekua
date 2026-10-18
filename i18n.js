/* pirekua — shared on every page: strings (EN/ES), the language engine and the
   EN | ES toggle (with the touch swipe). Load first; common.js and the page
   script build on window.pirekua. Vanilla JS, no dependencies. */

// Language toggle on touch screens (pointer: coarse): a switch you can swipe.
const TOGGLE_TAP_SLOP_PX = 6;       // movement under this is a tap on a label
const TOGGLE_FLICK_PX = 12;         // travel past this switches toward the swipe, even short of the middle
const TOGGLE_FLICK_VELOCITY = 0.4;  // px/ms; a faster flick also switches
const TOGGLE_HAPTIC_MS = 8;         // tiny vibration on switch, where supported
const TOGGLE_HINT_DELAY_MS = 1200;  // first visit only: wait this long after load, then...
const TOGGLE_HINT_PX = 8;           // ...nudge the thumb this far toward the other side and back
const TOGGLE_HINT_MS = 300;         // ...over this long
const TOGGLE_HINT_KEY = 'pirekua-toggle-hint';   // localStorage: the hint has been shown

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
    'meta.description': 'pirekua Mexican chili crisp. Made with amor y risas. Reserve yours for the holidays.',
    'lang.group': 'Language',
    'lockup.alt': 'pirekua, Mexican chili crisp',
    'hero.sub': 'It started with two friends, a stove, and a lot of laughing.',
    'hero.asideTl': 'it’s pronounced <span class="nobr">“pea-REC-kwa”</span>',
    'hero.asideBr': 'but you can just call us delicious',
    'cta.know': 'Reserve yours',

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
    'products.cardLabel': '{name}: reserve yours',

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

    // ---- Cookbook page titles: one per page, in COOKBOOK_PAGES order (script.js).
    //      Dish and product names stay in English, like the pages themselves. ----
    'cookbook.p1': 'The pirekua cookbook cover',
    'cookbook.p2': 'How to mix Sweet, Smoky and Spicy into your own blend',
    'cookbook.p3': 'The three staples: The Schmear, Spicy Mayo and The Zhuzh',
    'cookbook.p4': 'Recipe: Bagel with the Schmear',
    'cookbook.p5': 'Recipe: pirekua Egg Breakfast Tacos',
    'cookbook.p6': 'Recipe: Chorizo Feta Flatbread',
    'cookbook.p7': 'Recipe: Lime Shrimp Salad with Chili Crisp Vinaigrette',
    'cookbook.p8': 'Recipe: Salmon Avocado Rice Bowl with Spicy Mayo',
    'cookbook.p9': 'Recipe: The Vaquero with Cilantro Chimichurri Zhuzh',
    // ---- end of cookbook page titles ----
    'cookbook.pageOf': 'Cookbook page {n} of {total}',
    'cookbook.open': 'Open cookbook page {n}: {title}, larger',
    'cookbook.close': 'Close',
    'cookbook.hint': 'Tap a page to enlarge',

    's4.title': 'How much should I get?',
    'quiz.q1': 'Do you like sunrises or sunsets?',
    'quiz.q1a': 'Sunrises',
    'quiz.q1b': 'Sunsets',
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

    'privacy.title': 'Privacy Policy',
    'privacy.updated': 'Last updated: [DATE]',
    'privacy.collectH': 'What we collect.',
    'privacy.collect': "When you reserve on this site, we collect your name, email address, phone number and delivery address, what you reserved, and which part of the site you came from. That's it.",
    'privacy.useH': 'How we use it.',
    'privacy.use': "We use it to plan how much of each product to make, to contact you about your reservation (including how to pay before anything ships), and to send you confirmation emails and texts. We don't send much, and we're not here to spam you.",
    'privacy.whoH': 'Who sees it.',
    'privacy.who': "We don't sell or rent your information. It's stored with Notion (where we keep reservations), Netlify (our website host) and Resend (our email provider), who process it for us so we can plan production and send you messages.",
    'privacy.choicesH': 'Your choices.',
    'privacy.choices': "You can opt out of emails or texts at any time by replying \"stop\" or by contacting us. You can also ask us to change or delete your information.",
    'privacy.cookiesH': 'Cookies and tracking.',
    'privacy.cookies': "This site doesn't use advertising or tracking cookies. If you choose a language, your browser remembers that choice on your device.",
    'privacy.kidsH': 'Kids.',
    'privacy.kids': "This site isn't meant for children under 13.",
    'privacy.contactH': 'Contact.',
    'privacy.contact': '[CONTACT EMAIL]',

    // ---- Reserve page ----
    'reserve.metaTitle': 'Reserve · pirekua',
    'reserve.metaDescription': 'Reserve pirekua Mexican chili crisp for the holidays: the Holiday Gift Box or single jars. No payment today.',
    'reserve.title': 'Reserve your pirekua',
    'reserve.back': 'Back to home',
    'reserve.homeAlt': 'pirekua, back to home',

    'gift.name': 'The Holiday Gift Box',
    'gift.short': 'Holiday Gift Box',
    'gift.alt': 'The pirekua Holiday Gift Box',
    'gift.jarsAlt': 'One jar each of pirekua Sweet, Smoky and Spicy',
    'gift.desc': 'One jar each of Sweet, Smoky and Spicy, plus an empty jar with its own label, so you can mix up your own: a vinaigrette, a spicy mayo, whatever you dream up. Comes with a mini whisk and a mini spatula.',
    'gift.inside': 'What’s inside',
    'gift.i1': '1 jar of Sweet',
    'gift.i2': '1 jar of Smoky',
    'gift.i3': '1 jar of Spicy',
    'gift.i4': '1 empty mixing jar with its own label',
    'gift.i5': '1 mini whisk',
    'gift.i6': '1 mini spatula',
    'gift.qty': 'Gift boxes',
    'gift.bulk': 'Gifting a crowd? Reserve as many boxes as you like. Clients, partners, the whole team: we’d love to make them.',

    'jars.title': 'Or pick your jars',
    'qty.label': 'Quantity',
    'qty.dec': 'Decrease {name}',
    'qty.inc': 'Increase {name}',

    'summary.title': 'Your reservation',
    'summary.empty': 'Nothing here yet. Add a gift box or a jar.',
    'summary.remove': 'Remove',
    'summary.removeLabel': 'Remove {name}',
    'summary.total': 'That’s {sweet} Sweet, {smoky} Smoky, {spicy} Spicy and {oil} Chili Oil in all.',
    'summary.mixing1': 'Plus 1 empty mixing jar.',
    'summary.mixingN': 'Plus {n} empty mixing jars.',
    'summary.noPay': 'No payment today.',
    'summary.price': 'Total: {price}',
    'summary.live': '{name}, {n} in your reservation',
    'summary.keep': 'Keep browsing',
    'basket.open': 'Your reservation',
    'basket.aria': 'Your reservation, {n} items',
    'basket.ariaOne': 'Your reservation, 1 item',
    'basket.ariaEmpty': 'Your reservation, empty',

    'means.title': 'What reserving means',
    'means.p1': 'This is our first batch, made in small runs for friends and family. Your reservation is how we decide how much of each flavor to make for the holidays, so we make enough for everyone and waste nothing. That’s why we ask before we cook.',
    'means.p2': 'There’s no payment today. Once we know the final numbers, we’ll email you with the details and how to pay before anything ships.',
    'means.p3': 'Thank you for trusting us with your spot. It really does help.',

    'form.title': 'Where should we send it?',
    'form.first': 'First name',
    'form.last': 'Last name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.address': 'Address',
    'form.city': 'City',
    'form.state': 'State',
    'form.zip': 'ZIP',
    'form.stateDefault': 'Select a state',
    'form.required': 'This field is required.',
    'form.emailBad': 'Enter a valid email address.',
    'form.phoneBad': 'Enter a valid phone number.',
    'form.zipBad': 'Enter a 5-digit ZIP code.',
    'form.fix1': 'Please check 1 field below.',
    'form.fixN': 'Please check {n} fields below.',
    'form.empty': 'Add at least one item to reserve.',
    'form.recap': 'You’re reserving: {summary}',
    'form.consent': 'By reserving, you agree that pirekua may email and text you about your reservation. Reply STOP to opt out of texts.',
    'form.button': 'Reserve',
    'form.busy': 'Reserving…',
    'form.error': 'Something went wrong on our end. Your reservation isn’t lost: please try again.',

    'done.title': 'Reservation confirmed',
    'done.body': 'Thank you for reserving your spot. This tells us how much we need to make for the holiday season, and we really appreciate it. We just sent a confirmation to {email}.',
    'done.recap': 'You reserved',
    'done.home': 'Back to home',
  },

  es: {
    'meta.title': 'pirekua · chili crisp mexicano',
    'meta.description': 'Chili crisp mexicano pirekua. Made with amor y risas. Reserva el tuyo para las fiestas.',
    'lang.group': 'Idioma',
    'lockup.alt': 'pirekua, chili crisp mexicano',
    'hero.sub': 'Todo empezó con dos amigos, una estufa y un montón de risas.',
    'hero.asideTl': 'Se pronuncia <span class="nobr">“pea-REC-kwa”</span>',
    'hero.asideBr': 'pero puedes decirnos deliciosos',
    'cta.know': 'Reserva el tuyo',

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
    'products.cardLabel': '{name}: reserva el tuyo',

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

    // ---- Títulos de las páginas del recetario: uno por página, en el orden de COOKBOOK_PAGES.
    //      Los nombres de platillos y productos quedan en inglés, como en las páginas. ----
    'cookbook.p1': 'Portada del recetario de pirekua',
    'cookbook.p2': 'Cómo mezclar Sweet, Smoky y Spicy para crear tu propia mezcla',
    'cookbook.p3': 'Los tres básicos: The Schmear, Spicy Mayo y The Zhuzh',
    'cookbook.p4': 'Receta: Bagel with the Schmear',
    'cookbook.p5': 'Receta: pirekua Egg Breakfast Tacos',
    'cookbook.p6': 'Receta: Chorizo Feta Flatbread',
    'cookbook.p7': 'Receta: Lime Shrimp Salad with Chili Crisp Vinaigrette',
    'cookbook.p8': 'Receta: Salmon Avocado Rice Bowl with Spicy Mayo',
    'cookbook.p9': 'Receta: The Vaquero with Cilantro Chimichurri Zhuzh',
    // ---- fin de los títulos del recetario ----
    'cookbook.pageOf': 'Página {n} de {total} del recetario',
    'cookbook.open': 'Abrir la página {n} del recetario: {title}, más grande',
    'cookbook.close': 'Cerrar',
    'cookbook.hint': 'Toca una página para ampliarla',

    's4.title': '¿Cuántos debo llevar?',
    'quiz.q1': '¿Te gustan más los amaneceres o los atardeceres?',
    'quiz.q1a': 'Amaneceres',
    'quiz.q1b': 'Atardeceres',
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

    'privacy.title': 'Política de privacidad',
    'privacy.updated': 'Última actualización: [FECHA]',
    'privacy.collectH': 'Qué recopilamos.',
    'privacy.collect': "Cuando reservas en este sitio, recopilamos tu nombre, correo electrónico, teléfono y dirección de entrega, lo que reservaste y desde qué parte del sitio llegaste. Eso es todo.",
    'privacy.useH': 'Cómo lo usamos.',
    'privacy.use': "Lo usamos para planear cuánto hacer de cada producto, para contactarte sobre tu reservación (incluido cómo pagar antes de enviar nada) y para enviarte correos y mensajes de texto de confirmación. No enviamos mucho y no estamos aquí para llenarte de spam.",
    'privacy.whoH': 'Quién lo ve.',
    'privacy.who': "No vendemos ni rentamos tu información. Se guarda con Notion (donde llevamos las reservaciones), Netlify (nuestro proveedor de hosting) y Resend (nuestro proveedor de correo), que la procesan por nosotros para planear la producción y enviarte mensajes.",
    'privacy.choicesH': 'Tus opciones.',
    'privacy.choices': "Puedes dejar de recibir correos o mensajes de texto en cualquier momento respondiendo \"stop\" o contactándonos. También puedes pedirnos que cambiemos o borremos tu información.",
    'privacy.cookiesH': 'Cookies y rastreo.',
    'privacy.cookies': 'Este sitio no usa cookies de publicidad ni de rastreo. Si eliges un idioma, tu navegador recuerda esa elección en tu dispositivo.',
    'privacy.kidsH': 'Niños.',
    'privacy.kids': 'Este sitio no está pensado para menores de 13 años.',
    'privacy.contactH': 'Contacto.',
    'privacy.contact': '[CORREO DE CONTACTO]',

    // ---- Página de reservación ----
    'reserve.metaTitle': 'Reservar · pirekua',
    'reserve.metaDescription': 'Reserva chili crisp mexicano pirekua para las fiestas: la caja de regalo navideña o frascos sueltos. Hoy no se cobra nada.',
    'reserve.title': 'Reserva tu pirekua',
    'reserve.back': 'Volver al inicio',
    'reserve.homeAlt': 'pirekua, volver al inicio',

    'gift.name': 'La caja de regalo navideña',
    'gift.short': 'Caja de regalo navideña',
    'gift.alt': 'La caja de regalo navideña de pirekua',
    'gift.jarsAlt': 'Un frasco de cada uno de pirekua Sweet, Smoky y Spicy',
    'gift.desc': 'Un frasco de cada uno: Sweet, Smoky y Spicy, más un frasco vacío con su propia etiqueta para que prepares lo tuyo: una vinagreta, una mayonesa picante, lo que se te ocurra. Incluye un mini batidor y una mini espátula.',
    'gift.inside': 'Qué incluye',
    'gift.i1': '1 frasco de Sweet',
    'gift.i2': '1 frasco de Smoky',
    'gift.i3': '1 frasco de Spicy',
    'gift.i4': '1 frasco vacío para mezclar, con su propia etiqueta',
    'gift.i5': '1 mini batidor',
    'gift.i6': '1 mini espátula',
    'gift.qty': 'Cajas de regalo',
    'gift.bulk': '¿Regalas a mucha gente? Reserva todas las cajas que quieras. Clientes, socios, todo el equipo: nos encantará prepararlas.',

    'jars.title': 'O elige tus frascos',
    'qty.label': 'Cantidad',
    'qty.dec': 'Disminuir {name}',
    'qty.inc': 'Aumentar {name}',

    'summary.title': 'Tu reservación',
    'summary.empty': 'Aún no hay nada. Agrega una caja de regalo o un frasco.',
    'summary.remove': 'Quitar',
    'summary.removeLabel': 'Quitar {name}',
    'summary.total': 'En total: {sweet} Sweet, {smoky} Smoky, {spicy} Spicy y {oil} Chili Oil.',
    'summary.mixing1': 'Más 1 frasco vacío para mezclar.',
    'summary.mixingN': 'Más {n} frascos vacíos para mezclar.',
    'summary.noPay': 'Hoy no se cobra nada.',
    'summary.price': 'Total: {price}',
    'summary.live': '{name}: {n} en tu reservación',
    'summary.keep': 'Seguir viendo',
    'basket.open': 'Tu reservación',
    'basket.aria': 'Tu reservación, {n} artículos',
    'basket.ariaOne': 'Tu reservación, 1 artículo',
    'basket.ariaEmpty': 'Tu reservación, vacía',

    'means.title': 'Qué significa reservar',
    'means.p1': 'Esta es nuestra primera tanda, hecha en pequeñas cantidades para amigos y familia. Tu reservación nos dice cuánto hacer de cada sabor para las fiestas, para que alcance para todos y no se desperdicie nada. Por eso preguntamos antes de cocinar.',
    'means.p2': 'Hoy no se cobra nada. Cuando sepamos los números finales, te escribiremos con los detalles y cómo pagar antes de enviar nada.',
    'means.p3': 'Gracias por confiarnos tu lugar. De verdad nos ayuda.',

    'form.title': '¿A dónde lo enviamos?',
    'form.first': 'Nombre',
    'form.last': 'Apellido',
    'form.email': 'Correo',
    'form.phone': 'Teléfono',
    'form.address': 'Dirección',
    'form.city': 'Ciudad',
    'form.state': 'Estado',
    'form.zip': 'Código postal',
    'form.stateDefault': 'Selecciona un estado',
    'form.required': 'Este campo es obligatorio.',
    'form.emailBad': 'Escribe un correo válido.',
    'form.phoneBad': 'Escribe un teléfono válido.',
    'form.zipBad': 'Escribe un código postal de 5 dígitos.',
    'form.fix1': 'Revisa 1 campo abajo.',
    'form.fixN': 'Revisa {n} campos abajo.',
    'form.empty': 'Agrega al menos un artículo para reservar.',
    'form.recap': 'Vas a reservar: {summary}',
    'form.consent': 'Al reservar, aceptas que pirekua te escriba por correo y mensaje de texto sobre tu reservación. Responde STOP para dejar de recibir textos.',
    'form.button': 'Reservar',
    'form.busy': 'Reservando…',
    'form.error': 'Algo salió mal de nuestro lado. Tu reservación no se pierde: inténtalo de nuevo.',

    'done.title': 'Reservación confirmada',
    'done.body': 'Gracias por reservar tu lugar. Esto nos dice cuánto necesitamos hacer para las fiestas, y te lo agradecemos de corazón. Acabamos de enviar una confirmación a {email}.',
    'done.recap': 'Reservaste',
    'done.home': 'Volver al inicio',
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
    document.documentElement.classList.remove('i18n-pending');   // see the inline script in each page's <head>
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
    // A toggle that sits in a page header (data-no-tuck) never tucks.
    let lastY = window.scrollY, idleTimer = 0;
    const tucks = !toggle.hasAttribute('data-no-tuck');
    const setTucked = (on) => toggle.classList.toggle('is-tucked', on && !toggle.contains(document.activeElement) && !toggle.classList.contains('is-dragging'));
    if (tucks) window.addEventListener('scroll', () => {
      const y = window.scrollY;
      setTucked(y > 140 && y > lastY);
      lastY = y;
      clearTimeout(idleTimer);
      if (y > 140) idleTimer = setTimeout(() => setTucked(true), 2500);
    }, { passive: true });
    toggle.addEventListener('focusin', () => toggle.classList.remove('is-tucked'));

    // Keyboard bonus: Left selects EN, Right selects ES (focus follows the choice).
    toggle.addEventListener('keydown', (e) => {
      const next = e.key === 'ArrowRight' ? 'es' : e.key === 'ArrowLeft' ? 'en' : null;
      if (!next) return;
      e.preventDefault();
      if (next !== lang) { applyLang(next); storeLang(lang); }
      const btn = toggle.querySelector('[data-lang="' + next + '"]');
      if (btn) btn.focus();
    });

    initSwipeToggle(toggle);
  }

  /* Touch screens: swipe the toggle like a switch. Taps on a label still work
     (the buttons keep their own click handler), and mouse/keyboard are untouched. */
  function initSwipeToggle(toggle) {
    const coarse = window.matchMedia('(pointer: coarse)');
    const thumb = toggle.querySelector('.lang-toggle__thumb');
    const btns = { en: toggle.querySelector('[data-lang="en"]'), es: toggle.querySelector('[data-lang="es"]') };
    if (!thumb || !btns.en || !btns.es) return;
    const pos = { en: 0, es: 0 };

    // Measure the labels and park the thumb behind the active one.
    function measure() {
      if (!coarse.matches) { toggle.classList.remove('has-thumb', 'is-ready'); return; }
      pos.en = btns.en.offsetLeft; pos.es = btns.es.offsetLeft;
      toggle.style.setProperty('--thumb-w', Math.max(btns.en.offsetWidth, btns.es.offsetWidth) + 'px');
      toggle.style.setProperty('--thumb-h', btns.en.offsetHeight + 'px');
      toggle.style.setProperty('--thumb-y', btns.en.offsetTop + 'px');
      toggle.style.setProperty('--thumb-x', pos[lang] + 'px');
      toggle.classList.add('has-thumb');
      // enable the slide only after the first placement, so the page doesn't load with a slide
      requestAnimationFrame(() => requestAnimationFrame(() => toggle.classList.add('is-ready')));
    }
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
    if (coarse.addEventListener) coarse.addEventListener('change', measure);
    langListeners.push((l) => toggle.style.setProperty('--thumb-x', pos[l] + 'px'));

    let drag = null;        // { id, startX, startPos, x, samples, moved }
    let swallowClick = false;
    const clampX = (x) => Math.min(Math.max(x, Math.min(pos.en, pos.es)), Math.max(pos.en, pos.es));

    toggle.addEventListener('pointerdown', (e) => {
      swallowClick = false;                 // a new touch: its own click must go through
      if (!coarse.matches || e.pointerType === 'mouse' || drag) return;
      if (toggle.classList.contains('is-tucked')) return;   // never start a swipe while tucked away
      drag = { id: e.pointerId, startX: e.clientX, startPos: pos[lang], x: pos[lang], samples: [[e.timeStamp, e.clientX]], moved: false };
    });

    toggle.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved) {
        if (Math.abs(dx) < TOGGLE_TAP_SLOP_PX) return;
        drag.moved = true;
        try { toggle.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
        toggle.classList.add('is-dragging');
      }
      drag.x = clampX(drag.startPos + dx);
      thumb.style.transform = 'translateX(' + drag.x + 'px)';
      drag.samples.push([e.timeStamp, e.clientX]);
      if (drag.samples.length > 6) drag.samples.shift();
    });

    function finish(e, cancelled) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (!d.moved) return;                 // a tap: the label's own click handles it
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 400);
      let target = lang;
      if (!cancelled) {
        const mid = (pos.en + pos.es) / 2;
        target = d.x >= mid ? 'es' : 'en';  // nearer side...
        // ...unless it was a flick or a clear push: then the swipe's direction wins
        const first = d.samples[0], last = d.samples[d.samples.length - 1];
        const recent = d.samples.find((s) => last[0] - s[0] <= 100) || first;
        const dt = last[0] - recent[0];
        const v = dt > 0 ? (last[1] - recent[1]) / dt : 0;
        const travel = last[1] - d.startX;
        if (Math.abs(v) > TOGGLE_FLICK_VELOCITY) target = v > 0 ? 'es' : 'en';
        else if (Math.abs(travel) > TOGGLE_FLICK_PX) target = travel > 0 ? 'es' : 'en';
      }
      // drop the drag position; the thumb slides (or jumps, reduced motion) to the chosen side
      thumb.style.transform = '';
      toggle.classList.remove('is-dragging');
      if (target !== lang) {
        applyLang(target);
        storeLang(lang);
        if (navigator.vibrate && !reduceMotion()) { try { navigator.vibrate(TOGGLE_HAPTIC_MS); } catch (err) { /* ignore */ } }
      }
      // already on that side: it springs back (the slide above handles it)
    }
    toggle.addEventListener('pointerup', (e) => {
      if (drag && e.pointerId === drag.id && drag.moved) drag.samples.push([e.timeStamp, e.clientX]);
      finish(e, false);
    });
    toggle.addEventListener('pointercancel', (e) => finish(e, true));
    // capture lost without a pointerup (rare). Only the toggle's own capture counts: taking
    // capture fires a bubbling lostpointercapture from the button that had it implicitly.
    toggle.addEventListener('lostpointercapture', (e) => { if (e.target === toggle && drag && drag.moved) finish(e, false); });
    // after a swipe, ignore the click some browsers fire on release
    toggle.addEventListener('click', (e) => { if (swallowClick) { e.stopPropagation(); e.preventDefault(); swallowClick = false; } }, true);

    // First visit on a touch screen: one small nudge of the thumb toward the other side and back.
    function hint() {
      if (!coarse.matches || reduceMotion() || !toggle.classList.contains('has-thumb') || drag) return;
      try { if (window.localStorage.getItem(TOGGLE_HINT_KEY)) return; window.localStorage.setItem(TOGGLE_HINT_KEY, '1'); }
      catch (err) { return; }   // can't remember it: skip rather than nudge on every visit
      if (!thumb.animate) return;
      const x = pos[lang], dir = lang === 'en' ? 1 : -1;
      thumb.animate([
        { transform: 'translateX(' + x + 'px)' },
        { transform: 'translateX(' + (x + dir * TOGGLE_HINT_PX) + 'px)' },
        { transform: 'translateX(' + x + 'px)' },
      ], { duration: TOGGLE_HINT_MS, easing: 'ease-in-out' });
    }
    const startHint = () => setTimeout(hint, TOGGLE_HINT_DELAY_MS);
    if (document.readyState === 'complete') startHint(); else window.addEventListener('load', startHint);
  }


  // What the other scripts use.
  window.pirekua = Object.assign(window.pirekua || {}, {
    t,
    applyLang,
    storeLang,
    lang: () => lang,
    onLang: (fn) => langListeners.push(fn),
    reduceMotion,
  });

  // Show the remembered language once every page script has registered its
  // listeners (deferred scripts all run before DOMContentLoaded).
  const start = () => {
    const stored = readStoredLang();
    applyLang(stored === 'es' || stored === 'en' ? stored : 'en');
  };
  if (document.readyState === 'complete') setTimeout(start);
  else document.addEventListener('DOMContentLoaded', start);
})();
