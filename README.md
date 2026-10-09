# pirekua — marketing site (pass 1)

Single-page, static site. Plain HTML, CSS and vanilla JS. No framework, no build step.
Deploys from the repo root on Netlify (publish directory: `/`).

## In this pass

- Hero: lockup with sunrise bloom, scattered jars, bilingual tagline, party button
- Ristra divider: five hanging icon marks that swing
- Section 1: "What is Mexican chili crisp?"
- Signup modal (Netlify Forms, submitted with `fetch`)

Not yet built: header language toggle, the other four sections, the quiz, shop, footer.

## Files

| File | What it does |
|---|---|
| `index.html` | Page markup, the signup modal, and a hidden static copy of the form for Netlify |
| `styles.css` | Brand tokens, mobile-first layout, reduced-motion rules |
| `script.js` | Headline swap and timer, ristra swing, chile confetti, modal, validation, missing-asset placeholders |
| `assets/` | Brand art (see below) |

## Tuning knobs

- `HEADLINE_FLIP_MS` (top of `script.js`, default `10000`): how often the tagline flips language on touch devices.
- `HEADLINE_HOLD_MS` (next line, default `3500`): how long it stays flipped before flipping back.
- Ristra physics: `STIFFNESS`, `DAMPING`, `GAIN`, `MAX_ANGLE` in the ristra block of `script.js`.
- Any button with `data-party` gets the chile burst. Any button with `data-signup` opens the modal; its `data-source` fills the hidden `source` field.

## Assets

All files below are in `assets/`. They were taken from the brand book and renders artifacts and saved under the manifest names.

| File | Status | Notes |
|---|---|---|
| `lockup-primary.png` | Included | Exported from brand book board 01 (primary lockup), transparent background |
| `lockup-primary.svg` | **Still needed** | The page tries the SVG first and falls back to the PNG. Drop the master SVG in to replace it. |
| `icon-mark.png` | Included | |
| `chile-dot.png` | Included | Rasterized from the brand book SVG |
| `chile-sweet.png`, `chile-smoky.png`, `chile-spicy.png` | Included | Rasterized from the brand book SVGs |
| `chile-sweet-flip.png`, `chile-smoky-flip.png`, `chile-spicy-flip.png` | Included | The brand book's flipped versions |
| `leaf-1.png`, `leaf-2.png` | Included | |
| `bloom-sunrise.png` | Included | The bloom used behind the primary lockup in the brand book |
| `render-sweet.png`, `render-smoky.png`, `render-spicy.png` | Included | Resized to 720×900 for speed |
| `render-lineup.png` | Included | Resized to 1600×1000 |
| `render-chili-oil.png` | Included | Resized to 720×900 |

If any listed file is missing, the page shows a dashed placeholder box with the filename instead of substitute art.

Swap in final masters any time; keep the filenames. If a render's framing changes, adjust the crop numbers on `.jar img` and `.family__crop--* img` in `styles.css`.

## Signup form (Netlify Forms)

- The modal form is `name="signup"`, `data-netlify="true"`, with a honeypot (`bot-field`) and a hidden `source` field.
- It posts with `fetch` to `/`, so the modal stays open and shows "You're on the list."
- A hidden static copy of the form sits at the bottom of `index.html` so Netlify's build bot detects it. If Netlify ever reports a duplicate form name, delete that hidden copy: the modal form is already static HTML.
- Submissions only work on a Netlify deploy. Locally, submitting shows the calm "try again" message.

## Accessibility and motion

- Real `<button>` elements, visible focus rings, alt text on product renders, decorative art hidden from screen readers.
- The tagline halves are keyboard-focusable and swap language on focus. The heading's accessible name is always "Made with amor y risas."
- Modal: native `<dialog>`, focus trapped, Escape and backdrop click close it, focus returns to the button that opened it.
- `prefers-reduced-motion`: no confetti, no ristra swing, no headline timer. The modal opens straight away.
