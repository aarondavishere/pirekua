# pirekua — marketing site

Single-page, static site. Plain HTML, CSS and vanilla JS. No framework, no build step, no dependencies.
Deploys from the repo root on Netlify (see `netlify.toml`).

## Page order

1. Language toggle (EN | ES, fixed top right)
2. Hero: lockup with sunrise bloom, scattered jars, fixed tagline "Made with amor y risas.", party button
3. Ristra divider: five hanging icon marks that swing
4. Section 1: What is Mexican chili crisp?
5. Section 2: What does it taste like? + Not your usual chili crisp (media slot)
6. Section 3: Meet the lineup (Sweet, Smoky, Spicy, Chili Oil cards)
7. Section 4: What do I use it for? + cookbook carousel + cookbook button
8. Section 5: How much should I get? (the quiz)
9. Section 6: What is special about pirekua? (story copy and photo still to come)
10. Footer, with the Privacy Policy dialog

Not built yet: shop page, cart, payments, real cookbook pages, real making-of footage, real story copy, Spanish welcome email, SMS automation, analytics.

## Files

| File | What it does |
|---|---|
| `index.html` | Page markup, both dialogs (signup, privacy), and a hidden static copy of the signup form for Netlify |
| `styles.css` | Brand tokens, mobile-first layout, reduced-motion rules |
| `script.js` | Strings (EN/ES), language toggle, ristra swing, chile confetti, dialogs, validation, carousel, quiz, missing-asset placeholders |
| `netlify/functions/submission-created.js` | Sends the welcome email after each signup |
| `netlify.toml` | Publish the repo root; functions live in `netlify/functions` |
| `assets/` | Brand art (see below) |

## Tuning knobs (top of `script.js`)

| Constant | Default | What it does |
|---|---|---|
| `QUIZ_MIN` | `52` | Lowest possible quiz result |
| `QUIZ_MAX` | `93` | Highest possible quiz result |
| `DRUMROLL_MS` | `2500` | Anticipation beat after "Show me my results" |
| `BASKET_MS` | `2500` | Length of the jars-into-the-basket animation |
| `JOKE_DELAY_MS` | `500` | Pause after the basket before the joke line |
| `CTA_DELAY_MS` | `500` | Pause after the joke before the party button |
| `COOKBOOK_PAGES` | 6 entries | One entry per cookbook slide (see below) |

Ristra physics (`STIFFNESS`, `DAMPING`, `GAIN`, `MAX_ANGLE`) are in the ristra block of `script.js`.

Buttons:
- `data-signup` opens the signup modal; its `data-source` fills the hidden `source` field (`hero`, `cookbook`, `quiz`, and on the product cards `sweet`, `smoky`, `spicy`, `chili-oil`).
- `data-party` adds the chile burst. Only the hero and quiz buttons have it.

## Language toggle and translations

- EN | ES switches the whole page instantly, updates `<html lang>`, and remembers the choice on the device (`localStorage` key `pirekua-lang`). Default is English.
- On phones the toggle tucks away while you scroll down or pause, and comes back when you scroll up.
- Never translated: the tagline "Made with amor y risas.", the name pirekua, and the lockup art.
- All strings live in the `I18N` object in `script.js`, with `en` and `es` for every key. The Spanish is a draft for native-speaker review.

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

## Meet the lineup (product cards)

- Four cards: Sweet (Warm Yellow), Smoky (Cempasúchil Orange), Spicy (Deep Chili Red) and Chili Oil (Mole Ink, narrower). Product names are never translated.
- All four cards are always the same height, and names, taglines and descriptions line up across a row (CSS subgrid). With the full copy at 15px or more, cards come out taller than square. The jar windows stay the same size on every card.
- Each card is an `<article>` with one real `<button data-signup>` stretched over it. The buttons' `data-source` values are `sweet`, `smoky`, `spicy` and `chili-oil`, so Netlify Forms shows which product someone tapped.
- **Future:** the card button becomes "Shop" and links to that product's shop page (there's an HTML comment above the section).
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
| `render-sweet.png`, `render-smoky.png`, `render-spicy.png`, `render-lineup.png`, `render-chili-oil.png` | Included | Resized for speed |
| `chile-scatter.png` | Included | Brand book chile scatter tile, 600 × 600, shown at 300px |
| `tall-p-white.png` | Included | Brand book Treatment A, white stem and leaves (Leaf Green version) |
| `bloom-yellow.png`, `bloom-orange.png`, `bloom-red.png`, `bloom-outline.png` | Included | Brand book heat blooms (Icons board), rasterized at 128px |
| `basket.svg` | Included | Drawn for this pass: Mole Ink outline, Cream Card body, orange weave and rim, open top. Reusable as the cart icon |
| `making-of-placeholder.jpg` | **Still needed** | Owner drops in a stand-in photo (4:5). Shows a dashed placeholder until then |
| `cookbook/page-1.png` … `page-6.png` | **Still needed** | Slides show branded placeholders until then |

Any missing file shows a dashed placeholder box with its filename, never substitute art.

## Signup form (Netlify Forms)

- Fields: `email`, `phone` (one of the two is required), hidden `source`, hidden `lang`, honeypot `bot-field`.
- A consent line sits under the submit button.
- It posts with `fetch`, so the modal stays open and shows "You're on the list."
- A hidden static copy of the form at the bottom of `index.html` keeps Netlify's bot detecting the same fields. If Netlify ever reports a duplicate form name, delete that copy.

## Welcome email

- `netlify/functions/submission-created.js` runs automatically after every verified Netlify Forms submission. There's no polling or schedule.
- It only acts on the `signup` form. When a signup includes an email address, it sends the welcome email through Resend's REST API.
- Phone-only signups get nothing automatic. Export the numbers from Netlify Forms and text them by hand.
- Every signup gets the same English email for now. `lang` is stored for later.
- Check Netlify → Logs → Functions for `[welcome] sent …` or the reason a send failed. The API key is never logged.

Set these five environment variables in Netlify (Site configuration → Environment variables):

| Variable | Example | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `re_…` | Resend API key |
| `FROM_EMAIL` | `pirekua <hello@yourdomain.com>` | Sender. The domain must be verified in Resend |
| `REPLY_TO` | `hello@yourdomain.com` | Where replies go |
| `SITE_URL` | `https://pirekua.netlify.app` | Base URL, used for the logo image in the email |
| `COOKBOOK_URL` | `https://…` | Cookbook link. Leave empty to drop that line from the email |

Before launch, replace `[BUSINESS NAME + MAILING ADDRESS]` in the email footer (in the function file).

## Accessibility and motion

- Real buttons and inputs throughout, visible focus rings, alt text that translates.
- Dialogs: native `<dialog>`, focus trapped, Escape and backdrop click close them, focus returns to the button that opened them.
- Carousel: labelled region, "Slide N of 6" announced politely, 48px arrows, real dot buttons, left/right arrow keys, swipe.
- Quiz: radios and a range input, results announced through a polite live region.
- Lineup section and footer: cream on Leaf Green is 3.55:1. That fails the 4.5:1 target for normal text but passes the 3:1 bar for large text, so all footer text is set at 19px bold and the lineup heading is large. A strict 4.5:1 would need a darker green.
- `prefers-reduced-motion`: no confetti, ristra swing, drumroll, basket animation or transitions. The quiz shows its final state at once.
