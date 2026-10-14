# pirekua — marketing site

Static site with two pages: the home page (`/`) and the Reserve page (`/reserve/`). Plain HTML, CSS and vanilla JS. No framework, no build step. The only package is `@netlify/database`, used by the QR scan counter.
Deploys from the repo root on Netlify (see `netlify.toml`).

## Home page order

1. Language toggle (EN | ES, fixed top right)
2. Hero: fills the first screen. Lockup with sunrise bloom, scattered jars, two tilted asides, fixed tagline "Made with amor y risas.", "Reserve yours" party link
3. Ristra divider: five hanging icon marks that swing, just below the first screen
4. Section 1: What is Mexican chili crisp?
5. Section 2: What does it taste like? + Not your usual chili crisp (media slot)
6. Section 3: Meet the lineup (Sweet, Smoky, Spicy, Chili Oil cards)
7. Section 4: What do I use it for? + cookbook carousel + cookbook button
8. Section 5: How much should I get? (the quiz)
9. Section 6: What is special about pirekua? (story copy and photo still to come)
10. Footer, with the Privacy Policy dialog

Every call to action goes to the Reserve page: the hero and quiz "Reserve yours" links, the four lineup cards and "Get the cookbook" (see "Calls to action" below). There is no signup modal any more.

## Reserve page order (`/reserve/`)

1. Header: small lockup (links home), "Back to home", the language toggle (in the header, never tucks)
2. The Holiday Gift Box: the biggest panel and type on the page, with its own quantity stepper and the "Gifting a crowd?" note from 10 boxes up
3. Single jars: Sweet, Smoky, Spicy, Chili Oil cards, each with a stepper
4. What reserving means
5. The reservation form (all fields required) and the Reserve button
6. Footer, with the same Privacy Policy dialog

Plus the basket button: pinned top right under the language toggle, with the item count. It opens "Your reservation" as an overlay (a panel on the right from 640px up, a bottom sheet on phones). That overlay is the only place the reservation shows: there is no side column and nothing pinned to the bottom of the screen (both removed in pass 8).

Not built yet: payments, prices, shipping costs, taxes, inventory limits, order status, the real `/shop`, real cookbook pages, real making-of footage, real story copy, SMS automation, analytics.

## Files

| File | What it does |
|---|---|
| `index.html` | Home page markup and the privacy dialog |
| `reserve/index.html` | Reserve page markup: basket button, products, form (Netlify detects it here), the "Your reservation" overlay, confirmation and privacy dialogs |
| `styles.css` | Shared: brand tokens, buttons, fields, dialogs, toggle, footer, reduced-motion rules. Plus the home page layout |
| `reserve.css` | Reserve page layout (loaded after `styles.css`) |
| `i18n.js` | Shared, loaded first on every page: all strings (EN/ES, `I18N`), the language engine and the EN \| ES toggle with its touch swipe |
| `common.js` | Shared, loaded second: missing-asset placeholders, chile confetti (and party links), dialogs, the privacy policy |
| `script.js` | Home page only: jar art manifest, ristra swing, product card names, carousel, quiz |
| `reserve.js` | Reserve page only: `PRODUCTS`, steppers, basket button and overlay, "add to basket" flights, form validation, sending, confirmation |
| `netlify/functions/submission-created.js` | After each reservation: saves it to Notion, then sends the confirmation email |
| `netlify/functions/qr.mjs` | The QR short links (`/q/pack`, `/q/promo`): counts each scan, then redirects. Destinations live in `CODES` |
| `netlify/functions/qr-stats.mjs` | Private scan counts page: `/qr-stats?key=…` (needs `QR_STATS_KEY`) |
| `netlify/database/migrations/` | Netlify Database schema (the `qr_scans` table) |
| `marketing/qr/` | Print-ready QR codes (SVG + PNG). Rebuild with `npm run qr` (`scripts/make-qr.mjs`) |
| `netlify.toml` | Publish the repo root; functions live in `netlify/functions` |
| `assets/` | Brand art (see below) |

## Tuning knobs (top of `script.js`, home page)

| Constant | Default | What it does |
|---|---|---|
| `QUIZ_MIN` | `52` | Lowest possible quiz result |
| `QUIZ_MAX` | `93` | Highest possible quiz result |
| `DRUMROLL_MS` | `2500` | Anticipation beat after "Show me my results" |
| `BASKET_MS` | `3600` | Length of the jars-into-the-basket pour (keep under about 4000) |
| `JOKE_DELAY_MS` | `500` | Pause after the basket before the joke line |
| `CTA_DELAY_MS` | `500` | Pause after the joke before the party button |
| `BASKET_INSIDE_JARS` | `32` | Jars that pour into the basket and heap above the rim |
| `BASKET_TUMBLERS` | `8` | Jars that spill over the rim and land beside the basket |
| `BASKET_DROP_STAGGER_MS` | `70` | Gap between jars landing inside |
| `BASKET_SEED` | `7` | Seed for the heap's small random offsets. Same seed, same heap every run |
| `COOKBOOK_PAGES` | 6 entries | One entry per cookbook slide (see below) |
| `JAR_ART` | 7 per flavor | Jar cutout manifest (see "Jar art" below). The quiz basket picks its angles from here |
| `OIL_ART` | 5 entries | Chili Oil cutouts, same idea |

Ristra physics (`STIFFNESS`, `DAMPING`, `GAIN`, `MAX_ANGLE`) are in the ristra block of `script.js`.

## Tuning knobs (top of `reserve.js`, Reserve page)

| Constant | Default | What it does |
|---|---|---|
| `PRODUCTS` | 5 entries | One per product, in page order: `id`, `field` (the form field / Netlify column), name, `price` (`null` = no prices shown), `max` (`999`) |
| `BULK_NOTE_AT` | `10` | Gift boxes at which the "Gifting a crowd?" note appears |
| `CURRENCY` | `USD` | Used only once prices are filled in |
| `LIVE_DELAY_MS` | `600` | Quiet pause before a change is announced to screen readers ("Holiday Gift Box, 2 in your reservation") |
| `DONE_DIALOG_DELAY_MS` | `700` | Lets the confetti play before "Reservation confirmed" opens (0 with reduced motion) |
| `FLY_MS` | `650` | "Add to basket" flight time (ease-in-out) |
| `FLY_ARC_PX` | `90` | How far the flight path rises above the straight line at its middle |
| `FLY_MAX_AT_ONCE` | `6` | Flights in the air at once; beyond this the flight is skipped and the badge just updates |
| `FLY_SIZE_PX` | `52` | Height of the flying copy as it sets off (it shrinks to 40% on arrival) |
| `BUMP_MS` | `260` | The basket's bump (scale 1 → 1.12 → 1) when its count changes |
| `SOURCES` | `hero, cookbook, quiz, sweet, smoky, spicy, chili-oil` | `?source=` values kept; anything else is saved as `none` |
| `ADDABLE` | `gift-box, sweet, smoky, spicy, chili-oil` | `?add=` values that start that product at 1 |

The quantity max is `max` on each `PRODUCTS` entry (the inputs read it). The server clamps to 0–999 as well.

## Tuning knobs (shared: top of `i18n.js` and `common.js`)

| Constant | Default | What it does |
|---|---|---|
| `TOGGLE_TAP_SLOP_PX` | `6` | Touch toggle: movement under this is a tap on a label |
| `TOGGLE_FLICK_PX` | `12` | Touch toggle: travel past this switches toward the swipe, even short of the middle |
| `TOGGLE_FLICK_VELOCITY` | `0.4` | Touch toggle: a flick faster than this (px/ms) also switches |
| `TOGGLE_HAPTIC_MS` | `8` | Touch toggle: vibration on switch, where supported (skipped with reduced motion) |
| `TOGGLE_HINT_DELAY_MS`, `TOGGLE_HINT_PX`, `TOGGLE_HINT_MS` | `1200`, `8`, `300` | First-visit hint: wait, then nudge the thumb this far toward the other side and back, over this long |
| `TOGGLE_HINT_KEY` | `pirekua-toggle-hint` | `localStorage` key that remembers the hint was shown |
| `LANG_STORAGE_KEY` | `pirekua-lang` | Remembered language. Shared by both pages, so a choice on one carries to the other |
| `PARTY_NAV_DELAY_MS` (`common.js`) | `450` | Party links: how long the confetti plays before the page changes |

## Tuning knobs (CSS variables in `styles.css`)

| Variable | Where | What it does |
|---|---|---|
| `--hero-peek` | `.hero` | How much of the ristra peeks above the fold. `0px` = the hero fills the screen (`100svh`, `100vh` fallback) and the ristra starts just below it. `60px` would show 60px of it |
| `--hero-pad-top` / `--hero-pad-bottom` | `.hero` | Minimum space above the lockup / below the button. Content is centered vertically in what's left |
| `--hero-gap-tagline`, `--hero-gap-sub`, `--hero-gap-btn` | `.hero` | Lockup → tagline → subhead → button spacing (scale with screen height) |
| `--lockup-w` | `.hero` | Lockup width: `min(86vw, 820px, 130svh − 320px)`, so short screens shrink it to fit. `56vw` from 1024 to 1279px |
| `--lock-half` | `.hero` | Half the lockup width. Desktop jars measure their side bands from it |
| `--bloom-spin` | `.hero` | One full turn of the sunrise bloom (`60s`) |
| `--dot-lift` | `.hero` | How far the chile over the i is raised (`0.07em`) |
| `--jw`, `--r`, `--y` | `.jar--1` … `.jar--12` | Hero jar width, rotation and vertical position. Desktop: % of the hero. Below 1024px: an anchor inside a jar band, `calc(Npx * var(--band-k))` from the top or `calc(100% - Npx * var(--band-k))` from the bottom |
| `--jar-band-top`, `--jar-band` | `.hero` (below 1024px) | Hero button clear zone: the hero's top and bottom padding become bands for the upper jars + "pronounced" line and the lower jars + "delicious" line (phones 136 / 108px, 640–1023px 140 / 116px). Content can't enter padding, so nothing in a band can reach the button |
| `--btn-clear` | `.hero` (below 1024px) | The minimum empty space kept around the hero button (`24px`). Lower-band items are placed so their top edge stays at least this far below the band's top |
| `--band-k` | `.hero` (below 1024px) | Scales the bands and their jars together on short screens (`0.86` up to 760px tall, `0.76` up to 640px), so the hero still fits the first screen. The lockup width also subtracts the bands |
| `--side`, `--f` (1024px and up) | `.jar--N` | Which side of the lockup (`-1` left, `1` right) and how far out into that side band (0 = lockup edge, 1 = page edge) |
| `--left` (below 1024px) | `.jar--N` | Horizontal position as % of the hero. Jars 10–12 are hidden below 1024px |
| Phone jar set (below 640px) | `@media (max-width: 639.98px)` block | 6 jars: 3 in the upper band (1 sweet, 2 smoky, 3 spicy) and 3 in the lower band (5 sweet, 6 spicy, 9 smoky). Jars 4, 7 and 8 are hidden there only |
| Tablet jar set (640–1023px) | `@media (min-width: 640px) and (max-width: 1023.98px)` block | 9 jars: 1, 2, 3, 4 and 8 in the upper band, 5, 6, 7 and 9 in the lower band, the "delicious" line at the right of the lower band |
| `--jscale` | `.hero` | Shrinks every jar at once (`0.78` from 1024 to 1279px) |
| `--left`/`--side`/`--f`, `--y`, `--r`, `--align`, `--aside-w` | `.hero__aside--tl`, `--br` | The two tilted asides: position, tilt, text alignment and max width (they wrap past it) |
| `--rs-s`, `--rs-l`, `--rs-m`, `--rs-xl`, `--rs-s2` | `.ristra` | The five chile sizes, left to right |
| `--x`, `--w` | each `.ristra__chile` in `index.html` | Chile position and size. `is-mirrored` flips a chile (chiles 2 and 5) |
| `--products-pad-top`, `--products-pad-bottom`, `--products-title-gap` | `.products` | Lineup section spacing |
| `--pcard-pad`, `--pcard-gap`, `--oil-col` | `.products` | Card padding, space between cards, and the Chili Oil column width (desktop) |
| `--win-h` | `.products__grid` | Height of the product window on each card (`clamp(212px, 17vw + 12px, 248px)`) |
| `--win-air` | `.products__grid` | Empty space above and below each jar inside its plate (`7%` of the window: about 15–17px) |
| `--quiz-pad-top`, `--quiz-pad-bottom`, `--quiz-title-gap` | `.quiz` | Quiz section spacing |
| `--basket-clip` | `.basket-scene` | Top of the rim band (32% of the basket image) |
| `--basket-gap` | `.basket-scene` | How far the woven body is lifted toward the rim (`4px`): the art's 6px gap closes to a 2px line |
| `--basket-rim-cut` | `.basket-scene` | Jars inside the basket are clipped this far above the scene's bottom, i.e. at the rim's lower edge (`90px`) |
| `--r-max`, `--r-read`, `--r-gap`, `--r-radius` | `.rpage` (`reserve.css`) | Reserve page width (gift box and jars, `1200px`), reading width ("What reserving means" and the form, `720px`), space between sections, panel corners |
| `--basket-size`, `--basket-icon` | `.rpage` (`reserve.css`) | The round basket button (`60px`) and the basket art inside it (`46px` wide) |
| `--basket-under`, `--basket-top-min` | `.rpage` (`reserve.css`) | Gap under the toggle (`8px`), and where the button settles once the header scrolls away (`12px`) |
| `--sheet-w` | `.rpage` (`reserve.css`) | Width of the "Your reservation" panel from 640px up (`420px`) |
| `--stepper-size` | `.rpage` (`reserve.css`) | − and + button size (48px; 56px on the gift box) |

## Calls to action

| Where | Link | Notes |
|---|---|---|
| Hero | `/reserve/?source=hero` | "Reserve yours", `data-party` |
| Lineup cards | `/reserve/?source=sweet&add=sweet` (and `smoky`, `spicy`, `chili-oil`) | Stretched link over the card, named "Sweet: reserve yours". Lands with that product at 1 |
| Cookbook | `/reserve/?source=cookbook` | Keeps the "Get the cookbook" label |
| Quiz result | `/reserve/?source=quiz` | "Reserve yours", `data-party` |

- `data-party` on a link: a plain click fires the chile confetti, then follows the link after `PARTY_NAV_DELAY_MS`. With reduced motion it goes straight away. Cmd/Ctrl-click, middle-click and right-click are never intercepted.
- `data-party` on a button does nothing by itself; the script calls `pirekua.party(button)` when it wants the burst. The Reserve button fires it only once the reservation has gone through.
- Query values the Reserve page reads: `source` = `hero`, `cookbook`, `quiz`, `sweet`, `smoky`, `spicy`, `chili-oil` (anything else, or none, is saved as `none`); `add` = `sweet`, `smoky`, `spicy`, `chili-oil`, `gift-box`. Anything else is ignored.

## Language toggle and translations

- EN | ES switches the whole page instantly, updates `<html lang>`, and remembers the choice on the device (`localStorage` key `pirekua-lang`). The choice carries between the home and Reserve pages. Default is English.
- On phones the toggle tucks away while you scroll down or pause, and comes back when you scroll up.
- **Touch screens (`pointer: coarse`, any width):** the toggle is a switch. An orange thumb sits behind the active label and slides (200ms) when the language changes. Swipe right for ES, left for EN; a flick or a push past 12px switches even short of the middle; a short drag springs back. Taps on a label still work. The grab area is 12px bigger than the pill (invisible). It never starts a swipe while tucked, and never tucks mid-swipe. `touch-action: none` is on the toggle only, so the page scrolls as usual. On first visit the thumb gives one small nudge toward the other side (not with reduced motion).
- Touch toggle CSS variables (on `.lang-toggle.has-thumb`): `--toggle-slide` (`200ms`, the thumb slide) and `--toggle-hit` (`12px`, the invisible grab area). JS adds `.has-thumb` after measuring the labels, so without JS it stays a plain tap toggle.
- Mouse and keyboard are unchanged: two real buttons with `aria-pressed`. Bonus: with a label focused, Left selects EN and Right selects ES.
- Never translated: the tagline "Made with amor y risas.", the name pirekua, the product names (Sweet, Smoky, Spicy, Chili Oil) and the lockup art. "The Holiday Gift Box" is translated (`gift.name`, `gift.short`).
- All strings for both pages live in the `I18N` object in `i18n.js`, with `en` and `es` for every key. The Spanish is a draft for native-speaker review.
- Scripts load in order `i18n.js` → `common.js` → page script (all `defer`); `i18n.js` applies the remembered language once they've all run. Page scripts use `window.pirekua` (`t`, `lang()`, `onLang()`, `party()`, `createDialog()`, `reduceMotion()`).

To add a string:
1. Add the key to both `I18N.en` and `I18N.es`.
2. Point the element at it:
   - `data-i18n="key"` for text
   - `data-i18n-html="key"` for a string with markup or line breaks
   - `data-i18n-attr="alt:key;aria-label:other.key"` for attributes
3. A missing key falls back to English and logs a warning in the console.

## Cookbook carousel

- Slides come from `COOKBOOK_PAGES` in `script.js`, one `{ src }` per page.
- Each slide shows its image if the file exists. Otherwise it shows its branded "Cookbook image N" placeholder.
- To add the real pages, drop `page-1.png`, `page-2.png` and so on into `assets/cookbook/`. Square images, 1200 × 1200 or larger.

## Jar art

- Cutouts live in `assets/jars/` as `{flavor}-{n}.png`: `sweet`, `smoky`, `spicy`, `oil`. Transparent, no shadow, tightly cropped, 480px wide (oil 300px).
- Angles: `1` front (upright, used for the lineup cards and section 1), `2` three-quarter left, `3` three-quarter right, `4` high, `5` low, `6` side (story panel), `7` side (nutrition panel). Oil: `1` front, `2` three-quarter left, `3` three-quarter right, `4` high, `5` back.
- `assets/jars/small/` holds 200px copies with the same names. The hero and the quiz basket load these.
- **Manifest:** `JAR_ART` and `OIL_ART` at the very top of `script.js` list every file. To add or remove an angle, add or remove its line there; the basket only picks from what's listed.
- **Hero jars:** each `<div class="jar jar--N">` in `index.html` names its image directly (comment above the jar layer). Change the filename to change the angle; change its placement variables in `styles.css` (see the CSS table above) to move it.
- **Fallback chain:** `data-fallback="a|b"` tries each file in order. Jars go small cutout → full cutout → `render-{flavor}.png` with its old crop (`is-fallback`), then a dashed placeholder.
- To replace the cutouts with your own exports, overwrite the files with the same names (and re-make the `small/` copies).

## Pass 8 edits in one line each

- **Hero button clear zone:** below 1024px the jars live in two bands (the hero's top and bottom padding), so no jar or small line can come within 24px of "Reserve yours" at any size. Checked by measurement at 14 widths × 5 heights plus three phones: zero overlaps. Desktop keeps its side bands; the "pronounced" line moved slightly so it clears every jar by 24px.
- **Lineup windows:** each jar and the oil bottle sit inset by `--win-air` with equal air above and below; the windows are 12px taller so the jars barely shrink.
- **Quiz basket:** the basket is drawn as three slices of `basket.png` (back, rim, body); the body is lifted by `--basket-gap`, so the rim gap is a 2px line. The jars inside are clipped at the rim's lower edge and the tumblers have their own unclipped layer. A 4px Cream Card plug (the stage's own color) sits behind the rim and body, over the jars, so even a tumbler passing behind the basket's edge never shows through the line. Positions and timings are unchanged.
- **Reserve page:** the side column and the bottom bar are gone. The page is one full-width column; the reservation lives in the basket button's overlay. Adding with + flies the product to the basket.

## Pass 7 edits in one line each

- **Reserve page:** new `/reserve/` with the Holiday Gift Box first, single jars, "What reserving means", the reservation form and a running summary. No payment taken.
- **Calls to action:** every "Be in the know" button is now a link to `/reserve/` with its source; the signup modal, its strings, CSS and hidden form are gone. The privacy policy now describes reservations.
- **Shared code:** strings and the toggle moved to `i18n.js`; placeholders, confetti and dialogs to `common.js`; `script.js` is home-only.
- **Function:** the welcome email is replaced by the reservation handler: Notion first, then the confirmation email.

## Pass 6 edits in one line each (phones only, except the touch toggle)

- **Bloom stacking fix:** on iOS Safari the sunrise bloom painted in front of the wordmark. Root cause: WebKit ignores `aspect-ratio` on the absolutely positioned bloom window, so the window grew to the whole flower. The window now has an explicit height (`--lockup-w × 0.494785`, same 727 × 380 geometry as before) plus `clip-path`, `.lockup` is its own stacking context (`isolation: isolate`) with the bloom at z 0 and the wordmark, tagline, subhead and button at z 1, and on phones the wordmark is on its own layer. 640px and up renders pixel for pixel as before.
- **Phone jars:** 9 down to 6 (3 above, 3 below, 2 of each flavor), re-spaced; the bottom aside sits a little lower on phones for air under the button.
- **Language toggle:** a swipeable switch on touch screens (see "Language toggle and translations").

## Pass 5 edits in one line each

- **Jars:** shadow-free cutouts everywhere. 12 jars in the hero (9 on tablets; 6 on phones since pass 6) at mixed sizes and angles, plus two tilted asides. Mixed angles in the basket, front views on the lineup cards and in section 1.
- **Ristra:** back to the pass 3 ristra: five chiles, chiles 2 and 5 mirrored, same swing.
- **Hero:** fills the first screen; lockup, tagline and subhead are larger, and the ristra sits just below the fold.

## Pass 4 edits in one line each

- **Hero:** tighter spacing, so the button and the top of the ristra fit on a 1280 × 720 screen. The tagline and subhead each sit on one line, the chile dot is lifted, the sunrise bloom turns slowly, and six shadow-free jars splash out from the wordmark at every width.
- **Ristra:** ten chiles with resting tilts (undone in pass 5).
- **Lineup:** tighter spacing, slightly smaller cards, the heat chip closer to the text, and a wider Chili Oil column (`--oil-col`).
- **Quiz:** tighter spacing, the heading on one line, "Sunrises" / "Sunsets", the brand book market basket, and about 40 jars heaping in and spilling over.

## Meet the lineup (product cards)

- Four cards: Sweet (Warm Yellow), Smoky (Cempasúchil Orange), Spicy (Deep Chili Red) and Chili Oil (Mole Ink, narrower). Product names are never translated.
- All four cards are always the same height, and names, taglines and descriptions line up across a row (CSS subgrid). With the full copy at 15px or more, cards come out taller than square. The jar windows stay the same size on every card.
- Each card is an `<article>` with one real link stretched over it, to `/reserve/?source=…&add=…`, named "<product>: reserve yours".
- **Future:** when `/reserve` becomes `/shop`, update these links (there's an HTML comment above the section).
- The heat meter (bottom corner of each jar card) uses `bloom-yellow/orange/red/outline.png`. It's named "Heat: none / medium / high" for screen readers.
- Hover or keyboard focus: the card lifts slightly and an inset frame appears. On touch screens, a quieter frame shows at rest and the card presses down on tap. Reduced motion keeps the frame and drops the lift.

## Section 2 media slot

`.media-slot` holds `making-of-placeholder.jpg` today. To use a video, GIF or small photo carousel instead, swap the `<img class="media-slot__media">` (the HTML comment there shows how) and delete the caption chip.

## Assets

| File | Status | Notes |
|---|---|---|
| `lockup-primary.png` | Included | Exported from brand book board 01 |
| `lockup-primary.svg` | **Still needed** | The page tries the SVG first and falls back to the PNG |
| `icon-mark.png`, `chile-dot.png`, `bloom-sunrise.png` | Included | |
| `chile-sweet.png`, `chile-smoky.png`, `chile-spicy.png` (+ `-flip`) | Included | |
| `leaf-1.png`, `leaf-2.png` | Included | |
| `jars/sweet-1.png` … `sweet-7.png`, `smoky-1` … `7`, `spicy-1` … `7` | Included | Shadow-free cutouts, 480px wide, cut from the no-shadow renders in the Perikua Labels canvas. Side views (6, 7) show placeholder label text ([UPC], nutrition) until the real label art is final |
| `jars/oil-1.png` … `oil-5.png` | Included | Chili Oil cutouts, 300px wide. No low-angle oil yet |
| `jars/small/*.png` | Included | 200px copies of the jar cutouts for the hero and basket |
| `render-sweet.png`, `render-smoky.png`, `render-spicy.png`, `render-chili-oil.png` | Fallback only | Shown with their old crop only if a cutout is missing |
| `render-lineup.png` | Not used | Section 1 now builds the lineup from the three front cutouts plus the oil. Safe to delete later |
| `basket.png` | Included | Brand book "Woven market basket" (Icon set board, Market basket, the empty one), exported at 600 × 516 |
| `chile-scatter.png` | Included | Brand book chile scatter tile, 600 × 600, shown at 300px |
| `tall-p-white.png` | Included | Brand book Treatment A, white stem and leaves (Leaf Green version) |
| `bloom-yellow.png`, `bloom-orange.png`, `bloom-red.png`, `bloom-outline.png` | Included | Brand book heat blooms (Icons board), rasterized at 128px |
| `basket.svg` | Fallback only | The earlier drawn basket. Used only if `basket.png` is missing. Safe to delete later |
| `making-of-placeholder.jpg` | **Still needed** | Owner drops in a stand-in photo (4:5). Shows a dashed placeholder until then |
| `cookbook/page-1.png` … `page-6.png` | **Still needed** | Slides show branded placeholders until then |
| `gift-box.png` | **Still needed** | The Holiday Gift Box render for the Reserve page, about 1200 × 900 (4:3), transparent or on cream. Until it exists, a labeled placeholder shows with the Sweet, Smoky and Spicy front cutouts standing in it; once it loads, the jars step aside |

Any missing file shows a dashed placeholder box with its filename, never substitute art.

## Reserve page

### Products, quantities and prices

- Five steppers (gift box + four jars): − and + buttons (48 × 48px, named "Decrease Sweet" / "Increase Sweet"), and a number field you can type into (0–999; letters ignored; empty counts as 0).
- **Basket button:** pinned top right under the toggle, same look as the toggle. Its badge (Deep Chili Red, Warm Cream number, "99+" above 99) shows gift boxes plus jars and hides at 0. It bumps when the count changes, shows a "Your reservation" chip on desktop hover or focus, and its accessible name carries the count ("Your reservation, 3 items"; "… empty"). It's the first control after the header, steps aside on phones if it would sit over a field being typed into, and never covers the toggle or "Back to home".
- **"Your reservation" overlay:** the basket opens the native `#summary-sheet` dialog. From 640px up it's a full-height panel on the right that slides in; on phones a bottom sheet (up to 85% tall) that slides up. The page doesn't move or scroll behind it (the page is padded by the scrollbar's width while it's open). Escape, the backdrop, X and "Keep browsing" close it, and focus returns to the basket. "Reserve" closes it and moves to the form; it's hidden when the reservation is empty.
- **"Add to basket":** each + (and a typed number, once committed, if it went up) sends a small copy of that product along an arc to the basket: the gift box flies as its three front jars until `gift-box.png` exists, the others as their front cutout. The steppers, summary and hidden fields update at the click; the badge and the bump wait for the landing. Going down never flies. `?add=` on arrival just sets the badge.
- Summary lines (in the overlay) read "Holiday Gift Box × 2", each with Remove. Below them, the production total counts every gift box as one Sweet, one Smoky and one Spicy, plus "Plus N empty mixing jars" when there are gift boxes. "No payment today." always shows.
- Changes are announced politely to screen readers.
- **Turning on prices later:** set `price` on each entry in `PRODUCTS` at the top of `reserve.js` (e.g. `price: 38`). The cards then show the price, each summary line shows its subtotal, and the summary shows a total (`CURRENCY` sets the format). Leave them all `null` and no prices appear anywhere. The "No payment today" line stays either way; change `summary.noPay` when payment starts.

### Reservation form (Netlify Forms)

- `<form name="reservation" data-netlify="true" netlify-honeypot="bot-field">` lives in `reserve/index.html`, so Netlify detects it at deploy. The old `signup` form is gone (its past submissions stay in Netlify).
- Required fields: `first_name`, `last_name`, `email`, `phone`, `address`, `city`, `state` (50 states + DC), `zip` (5 digits or ZIP+4).
- Hidden fields: `form-name`, `lang`, `source`, `gift_boxes`, `sweet`, `smoky`, `spicy`, `chili_oil` (integers), `order_summary` (English, e.g. "2 Holiday Gift Boxes, 3 Smoky, 1 Spicy"), honeypot `bot-field`.
- Validation runs on submit and on leaving a field: inline messages under each field, a count at the top of the form, focus to the first problem. An empty reservation shows "Add at least one item to reserve." by the button and moves to the gift box. The button is never disabled.
- Sending: "Reserving…", fields locked, `fetch` POST to `/`. On success: confetti, then "Reservation confirmed" with a recap and "Back to home"; the page resets underneath. On failure: no confetti, nothing is cleared, and a retry message shows.

### Renaming `/reserve` to `/shop` later

1. Rename the folder `reserve/` to `shop/` (and, if you like, `reserve.css` / `reserve.js`, updating the two tags in its `<head>`).
2. Update the seven links in `index.html` (search for `/reserve/`).
3. Add a redirect so old links keep working, in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/reserve/*"
     to = "/shop/:splat"
     status = 301
   ```
The page uses root-relative paths (`/styles.css`, `/assets/…`), so nothing inside it needs to change. Netlify serves `/reserve` and `/reserve/` from `reserve/index.html` on its own; no redirect is needed for that.

## Reservation function (Notion first, then email)

`netlify/functions/submission-created.js` runs automatically after every verified Netlify Forms submission and only acts on the `reservation` form:

1. Re-reads the quantities (clamped to 0–999), recomputes the production totals and order summary on the server, and rejects a reservation with no items.
2. Looks in Notion for a page with the same **Submission ID**. If it exists, no duplicate is created (and if its email already went out, it stops there).
3. Creates the Notion page. **If Notion fails, no customer email is sent**; if `OWNER_NOTIFY_EMAIL` is set, the owners get an alert with the submission id. The Netlify Forms copy (Netlify → Forms → reservation) is the backup.
4. Sends the confirmation email (English or Spanish, by `lang`) through Resend, then sets **Email status** on the Notion page to Sent or Failed.
5. If `OWNER_NOTIFY_EMAIL` is set, sends the owners a short "New reservation" email with a link to the Notion page.

Logs (Netlify → Logs → Functions) start with `[reserve]` and show the submission id, the step and the outcome, never keys or full personal details.

The confirmation email says thank you, lists what they reserved, says nothing is charged today and that you'll email how to pay before anything ships, invites a reply for changes, and adds the cookbook link if `COOKBOOK_URL` is set. Before launch, replace `[BUSINESS NAME + MAILING ADDRESS]` in the footer (in the function file).

### Notion setup

1. In Notion, create a database (full page) called "Reservations" with exactly these properties (names and types must match):

| Property | Type | Filled with |
|---|---|---|
| `Name` | Title | "First Last" |
| `Submission ID` | Text | Netlify submission id (used to prevent duplicates) |
| `Reserved at` | Date | When it was saved |
| `First name` | Text | |
| `Last name` | Text | |
| `Email` | Email | |
| `Phone` | Phone | |
| `Address` | Text | |
| `City` | Text | |
| `State` | Text | Two letters, e.g. WI |
| `ZIP` | Text | |
| `Gift boxes` | Number | |
| `Sweet jars` | Number | Single jars only, as entered |
| `Smoky jars` | Number | Single jars only |
| `Spicy jars` | Number | Single jars only |
| `Chili Oil` | Number | |
| `Total Sweet` | Number | Single jars + one per gift box (what to make) |
| `Total Smoky` | Number | Same |
| `Total Spicy` | Number | Same |
| `Total Chili Oil` | Number | Same as Chili Oil |
| `Empty mixing jars` | Number | Equals gift boxes |
| `Order summary` | Text | e.g. "2 Holiday Gift Boxes, 3 Smoky, 1 Spicy" |
| `Language` | Select | Options `en`, `es` |
| `Source` | Text | hero, cookbook, quiz, sweet, smoky, spicy, chili-oil or none |
| `Email status` | Select | Options `Sent`, `Failed` |

2. Create an internal integration at notion.so/my-integrations, copy its secret (`NOTION_TOKEN`).
3. Open the database, ••• → Connections → add that integration.
4. Copy the database id from its URL (the 32 characters before `?v=`) into `NOTION_DATABASE_ID`.
5. Later you can add a `Status` property of your own; the function doesn't touch it.

### Environment variables

Set these in Netlify (Site configuration → Environment variables), never in the repo:

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NOTION_TOKEN` | Yes | `ntn_…` | Notion integration secret. If missing, nothing is written and the function logs which variable is missing |
| `NOTION_DATABASE_ID` | Yes | `1a2b…` | The Reservations database |
| `RESEND_API_KEY` | Yes, for email | `re_…` | Resend API key. If missing, reservations still save to Notion with Email status = Failed |
| `FROM_EMAIL` | Yes, for email | `pirekua <hello@yourdomain.com>` | Sender. The domain must be verified in Resend |
| `REPLY_TO` | Recommended | `hello@yourdomain.com` | Where replies go ("Need to change something? Just reply") |
| `SITE_URL` | Recommended | `https://pirekua.netlify.app` | Base URL, used for the logo in the email |
| `COOKBOOK_URL` | Optional | `https://…` | Cookbook link. Leave empty to drop that line |
| `OWNER_NOTIFY_EMAIL` | Optional | `emma@…, aaron@…` | Owners' address(es), comma-separated: "New reservation" emails and Notion-failure alerts |

## Accessibility and motion

- Real buttons and inputs throughout, visible focus rings, alt text that translates.
- Dialogs: native `<dialog>`, focus trapped, Escape and backdrop click close them, focus returns to the button that opened them.
- Reserve page: every input has a label (steppers are named by product, e.g. "Sweet Quantity"), errors use `aria-invalid` and `aria-describedby`, the top-of-form message and send errors are alerts, summary changes are announced politely, and Remove keeps focus in the overlay. The basket button is a real button with `aria-haspopup="dialog"` and a live accessible name; the overlay traps focus. The whole page works by keyboard.
- Carousel: labelled region, "Slide N of 6" announced politely, 48px arrows, real dot buttons, left/right arrow keys, swipe.
- Quiz: radios and a range input, results announced through a polite live region.
- Lineup section and footer: cream on Leaf Green is 3.55:1. That fails the 4.5:1 target for normal text but passes the 3:1 bar for large text, so all footer text is set at 19px bold and the lineup heading is large. A strict 4.5:1 would need a darker green.
- Hero jars and asides: jars are decorative (`aria-hidden`, `alt=""`, no pointer events); the asides are real text and translate.
- Language toggle: on touch screens it can be swiped, but the two real buttons, `aria-pressed`, focus rings, Tab/Enter/Space and taps all work as before; arrow keys also switch.
- `prefers-reduced-motion`: no bloom spin, confetti (party links navigate at once, the confirmation opens at once), overlay slide, "add to basket" flight or basket bump (the badge updates at once with a brief static highlight), ristra swing, drumroll, basket animation or transitions. The toggle thumb jumps instead of sliding, with no first-visit nudge and no haptic tick. The quiz shows its final state at once.

## QR codes

Two codes, both in `marketing/qr/` (SVG for print, 2000px PNG for everything else), in Mole Ink on Warm Cream:

| Code | Encodes | Sends people to | Use it for |
|---|---|---|---|
| `qr-packaging` | `https://mexicanchilicrisp.com/q/pack` | `/reserve/` | Jars and packaging: counts customers coming back after a purchase |
| `qr-marketing` | `https://mexicanchilicrisp.com/q/promo` | `/` | Flyers, posters, markets, social |

Every scan is counted (code, country, time; nothing personal) and the visitor lands on the page with `utm_*` tags. To change where a code goes, edit `CODES` in `netlify/functions/qr.mjs`: the printed codes stay the same. To see the counts, set the `QR_STATS_KEY` environment variable to a long random value and open `/qr-stats?key=<that value>`. For print, keep the code at least 2 cm (0.8 in) wide and keep the cream border around it.
