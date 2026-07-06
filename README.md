# Harvest Flow Website

Marketing site for Harvest Flow — a harvest operations platform that helps
farms, packhouses, co-ops, and produce logistics teams plan crews, track
yields, monitor quality, manage inventory, and prepare shipments from one
operating layer.

This is currently a **static site** (no build step, no framework).

## Design system

The UI is a mature **retro-pixel agricultural operations OS** — a serious
harvest-operations platform presented as a polished pixel operating system.
The visual language (defined in `src/styles/`) is built from:

- Square / near-square corners (`--r-card: 0`, `--r-control: 2px`)
- Hard offset pixel shadows with zero blur (`--shadow-pixel*`)
- Deep-black / deep-green crisp outlines (2–3px)
- A faint blueprint **grid overlay** on the paper canvas and dark panels
- **Scanline** textures on dark command surfaces (dashboard board, footer)
- Segmented **pixel progress bars** and square sprite-style status markers
- Mono operational labels/badges, a geometric display face for headings
- Tactile pressed states on every button (translate + shrinking shadow)

Palette: deep crop green, leaf green, harvest amber, wheat gold, soil brown,
warm off-white canvas, sky blue (informational), tomato red (QC/alerts only).
Type: Space Grotesk (display headings), JetBrains Mono (metrics/labels/data),
Inter (body copy).

The product **dashboard panels** (hero card + the Insights command board) are
the primary visual signal. Advanced Three.js / Chart.js / animation work is
intentionally left as isolated module hooks for a later phase.

## Tech stack

- Plain HTML5 / CSS3 (no preprocessor, no framework)
- Vanilla JavaScript, loaded as native ES modules
- [GSAP](https://gsap.com/) + ScrollTrigger — scroll reveals, loader timeline (CDN, optional)
- [anime.js](https://animejs.com/) — small interaction/micro-animations (CDN, optional)
- [Three.js](https://threejs.org/) — animated hero scene, loaded via import map (CDN, optional)
- [Chart.js](https://www.chartjs.org/) — dashboard charts (CDN, optional)

All four libraries are loaded from CDN `<script>`/import-map tags in
`index.html` and are treated as **optional enhancements**: every module that
uses one of them checks whether it loaded before using it, and falls back to
a static/CSS/canvas equivalent if it didn't (offline, blocked CDN, slow
network, etc.).

## Project structure

```
index.html                     Semantic markup only — no inline <style>/<script> blocks
README.md
src/
  styles/
    tokens.css                 Design tokens: colors, spacing, shadows, fonts
    base.css                   Reset, base typography, global helpers (.shell, .sr-only, focus)
    layout.css                 Reveal animations, loader, header/nav layout
    components.css             Modal, form fields, and small responsive tweaks
    responsive.css             Breakpoint rules for hero/dashboard layout
  scripts/
    main.js                    App entry point — wires up every module on DOMContentLoaded
    loader.js                  Boot loader progress bar / intro sequence
    navigation.js               Header scroll state + mobile nav overlay
    modal.js                   Request-demo modal open/close/submit + focus trap
    scrollLock.js               Shared body-scroll lock/unlock (loader, nav, modal)
  animations/
    gsap.js                    Scroll-triggered reveals, counters, parallax (GSAP)
    anime.js                   Micro-interactions: button taps, live dot, badges (anime.js)
  three/
    heroScene.js                Animated hero canvas (Three.js, with 2D canvas fallback)
  charts/
    dashboardCharts.js         Insights dashboard charts (Chart.js, with canvas fallback)
assets/
  images/                      Local image assets (currently sourced from Unsplash by URL)
  audio/                       Reserved for future optional sound effects
```

`src/scripts/main.js` is the only script `index.html` loads directly
(`type="module"`); every other script/animation/chart module is imported
from there.

## How to run locally

No build step or dependencies are required. Serve the folder with any
static file server, for example:

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

or, if you have Node:

```bash
npx serve .
```

Opening `index.html` directly via `file://` will mostly work, but serving it
over HTTP is recommended since the hero scene uses a dynamic `import('three')`
and browsers restrict ES module loading over `file://` in some configurations.

## Planned Three.js / GSAP / anime.js / Chart.js integration

The current implementations in `src/three/heroScene.js`,
`src/animations/gsap.js`, `src/animations/anime.js`, and
`src/charts/dashboardCharts.js` preserve the original site's behavior
(animated hero blocks, scroll reveals, button micro-interactions, and
dashboard charts). They are intentionally kept in isolated modules so the
planned retro-pixel redesign phase can restyle or replace what each one
renders without touching loader/nav/modal logic.

## Future optional sound effects

A **sound-toggle placeholder** button already lives in the header
(`#soundToggle`, currently `disabled`) so the future control has a reserved
home in the pixel UI. `assets/audio/` is reserved for short, optional UI sound
effects (e.g. modal open/close, menu toggle) that may be added in a later
phase. Any sound effects added later should be:
- opt-in / muted by default, with a visible mute toggle
- skipped entirely when `prefers-reduced-motion: reduce` is set
- kept small (compressed, < 50KB each) since they load over the network

## Accessibility notes

- `.skip-link` lets keyboard users jump straight to `#main`.
- The mobile nav overlay and request-demo modal are both `role="dialog"`
  with `aria-modal="true"`, trap focus while open (see `trapFocus` in
  `navigation.js` / `modal.js`), and restore focus to the triggering element
  on close.
- `Escape` closes the modal (if open) or the mobile nav (if open); `Tab` is
  trapped inside whichever one is open — handled centrally in `main.js`.
- Decorative SVGs/images use `aria-hidden="true"` or empty `alt=""`;
  informative images have descriptive `alt` text.
- Form fields all have associated `<label>`s and native `required`/`type`
  validation via `form.reportValidity()`.
- `:focus-visible` has a visible 3px outline defined in `base.css`.

## Reduced-motion notes

All animation modules read
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` once in
`main.js` and pass it down as `reduceMotion`:
- `loader.js` skips the animated fill and finishes immediately.
- `gsap.js` skips scroll-triggered reveals/parallax and marks reveal
  elements visible immediately instead.
- `anime.js` skips all micro-interactions.
- `heroScene.js` stops the idle sway/marker bounce (still renders once).
- `dashboardCharts.js` disables Chart.js animation.
- `responsive.css`/`layout.css` also include a
  `@media (prefers-reduced-motion: reduce)` block that collapses
  transition/animation durations globally as a CSS-level backstop.

## Where to edit styles/scripts

- **Design tokens** (colors, spacing, radii, shadows, fonts): `src/styles/tokens.css`
- **Global reset/typography/utilities**: `src/styles/base.css`
- **Page-level layout, loader, header, reveal animations**: `src/styles/layout.css`
- **Modal, form fields, small responsive tweaks**: `src/styles/components.css`
- **Breakpoint/responsive rules**: `src/styles/responsive.css`
- **Loader / nav / modal / scroll-lock behavior**: `src/scripts/*.js`
- **Boot sequence / wiring**: `src/scripts/main.js`
- **Hero scene, charts, extra animation**: `src/three/`, `src/charts/`, `src/animations/`

## Verification checklist

After making changes, verify locally before committing:

- [ ] Start a local server and load `index.html` with no 404s
- [ ] Desktop layout (≥1024px) renders as expected
- [ ] Mobile layout (≤640px) renders as expected, no horizontal overflow
- [ ] Mobile menu button opens the nav overlay; close button and `Escape` close it
- [ ] Request-demo modal opens from header/hero/footer/nav triggers
- [ ] Modal form validates required fields, "submits", shows the success state, and closes
- [ ] Loader plays once on load and removes itself
- [ ] No errors in the browser console
- [ ] `prefers-reduced-motion: reduce` disables reveal/parallax/loader animation
