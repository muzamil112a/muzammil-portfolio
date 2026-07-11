# BUILD SPEC — Muzammil's Cinematic Portfolio

> **Instructions for the agent building this:** Read this entire file before writing any code. Build in the phase order given in "Build order" at the bottom — **do not skip ahead, and do not build a later phase's feature early even if it seems easy.** Each phase must be finished and verified before the next begins. After each phase, run the dev server, confirm that phase's checks, and stop for review. All assets already exist under `public/assets/` with the exact filenames listed below — never rename them, never generate placeholders for them. If something in this spec is ambiguous, choose the simpler interpretation and leave a `// SPEC:` comment rather than asking.
>
> **Current state:** Phase 1 (skeleton) is complete. Sections exist as empty divs with temp labels. A terminal was built early, out of order — treat it as a rough draft to be rebuilt properly in Phase 6 per Section 7 below. **Resume at Phase 2.**

## What this is

A cinematic, dark-gothic portfolio website for **Muhammad Muzammil — Junior AI Automation Engineer**. The site is a single-page scroll journey: a lone man walks through a foggy abandoned town, arrives at a grand gothic mansion, and the mansion's courtyard becomes the navigation hub. Inspired by aliabyer.dev but aiming higher: scroll-scrubbed video, depth-parallax stills, reactive audio, a terminal-style AI chat footer, and a custom cursor.

Tone: Silent Hill atmosphere — fog, rain, warm lantern glow against cold blue-grey darkness. Premium, restrained, never cheesy.

## Tech stack

- **Vite + React 18** (JavaScript, not TypeScript)
- **GSAP + ScrollTrigger** for all scroll animation
- **Three.js** (via vanilla three, not r3f, to keep bundle lean) for fog particles
- **Tailwind CSS** for styling
- **Web Audio API** (raw, no library) for the audio engine
- Deploy target: **Vercel**

## Assets (already in place — do not rename, do not move)

All paths relative to `public/`:

| Asset | Path | Details |
|---|---|---|
| Hero video | `assets/video/hero-walk.mp4` | 1280×720, 121 frames, 5.04s, **every frame is a keyframe** (encoded for scrubbing), no audio track |
| Scene 2 | `assets/images/scene-2.png` | Man stopped, mansion silhouette in distance |
| Scene 3 | `assets/images/scene-3.png` | Man at the iron gate, mansion glowing |
| Scene 4 / Hub | `assets/images/scene-4-hub.png` | 2560×1440. Courtyard with **four blank stone tablets** in a row, man centered bottom, mansion behind |
| Scene 5 / Terminal | `assets/images/scene-5-terminal.jpeg` | Mansion study interior at night: a vintage CRT monitor on a carved wooden desk, **screen blank and black**, candles + oil lamp, bookshelves, gothic window. The live terminal renders *inside this monitor's screen* |
| Rain loop | `assets/audio/rain-loop.mp3` | 114s, seamless loop (pre-crossfaded), EQ'd |
| Drone loop | `assets/audio/drone-loop.mp3` | 118s, seamless loop, mixed quieter than rain by design |
| Gate creak | `assets/audio/gate-creak.mp3` | 3.0s, slow swell envelope |
| Narration 1 | `assets/audio/narration-1.mp3` | 9.3s — "In every fog... there is one who does not lose his way. I am Muhammad Muzammil." |
| Narration 2 | `assets/audio/narration-2.mp3` | 6.0s — "Where others see chaos... I see the architecture of what could be." |
| Narration 3 | `assets/audio/narration-3.mp3` | 5.7s — "Every door in this mansion... was forged by my own hands." |
| Narration 4 | `assets/audio/narration-4.mp3` | 3.9s — "Four paths lie before you... choose." |

## Page flow (in order)

### 1. Loading screen
- Full black. Centered: "MUZAMMIL" in a serif display font (e.g. Cormorant Garamond or Cinzel from Google Fonts), letter-spaced, dim gold (#c9a227 at ~60%).
- Below it a thin progress bar that fills as assets preload (video + all images + all audio via fetch/XHR so progress is real, not fake).
- When loading completes, the bar fades and is replaced by **two entry options**: **"ENTER THE FOG"** (primary — ghost button, thin gold border, subtle pulse; enables sound) and below it, smaller and dimmer, **"enter silently"** (text link; enters with audio muted — mute toggle can re-enable later). A small caption under the buttons: *"Sound on. Best with the lights low."*
- Clicking either: (a) initializes/resumes the AudioContext (even the silent path — create the context muted so unmuting later works), (b) if fog entry: rain + drone fade in over 2s, (c) triggers the gate sequence.
- Until ENTER is clicked, scrolling is locked (`overflow: hidden` on body).

### 2. Gate opening (transition, not a scrollable section)
- Two black wrought-iron gate panels (CSS/SVG — build them with layered divs or an inline SVG silhouette; do NOT require an image asset) covering the viewport, meeting in the middle.
- On ENTER: play `gate-creak.mp3` once, panels rotate/slide open outward over ~2.5s (GSAP, ease power2.inOut) revealing the hero behind. Fog opacity spikes during the opening then settles.
- After the gates finish, unlock scrolling and play narration-1.

### 3. Hero — scroll-scrubbed video
- Full-viewport `<video>` (muted, playsinline, preload=auto) of `hero-walk.mp4`, object-fit: cover.
- Pinned section, height ≈ 300vh of scroll distance. GSAP ScrollTrigger scrub maps scroll progress 0→1 to `video.currentTime` 0→duration. Scroll down = man walks forward; scroll up = he walks backward. Use `requestAnimationFrame`-throttled currentTime writes; do not set currentTime more than once per rAF.
- Overlay (fades in after gate opens): "MUHAMMAD MUZAMMIL" (serif, large) and beneath it "Junior AI Automation Engineer" (small caps, tracked out, dim). Both parallax slightly upward and fade as scrolling begins.
- Subtle vignette + film grain over everything (see Global effects).

### 4. About — scene-2
- Transition from hero: fog-wipe — a full-screen fog layer swells to opacity 1 over the last 10% of the hero's scroll range, scene swaps underneath, fog recedes.
- `scene-2.png` full-viewport, with:
  - Slow Ken Burns (scale 1.0 → 1.06 across the section's scroll range, scrubbed)
  - Mouse-move parallax: background layer shifts up to ±8px opposite the cursor (desktop only)
- Narration-2 plays once when the section first enters (ScrollTrigger onEnter, fire once).
- Content: a short "About" block that reveals as you scroll — 2–3 sentences drawn from this positioning: *Software Engineering graduate (University of Lahore). Junior AI Automation Engineer at Wanile Technologies. Builds intelligent automation workflows with n8n, Zapier, MCP Servers, REST APIs, and AI models (Claude, ChatGPT). Also experienced in WordPress/WooCommerce development.* Text appears in a translucent dark panel, left-aligned, gold headings.

### 5. Projects — scene-3
- Same fog-wipe transition in.
- `scene-3.png` background with the same Ken Burns + parallax treatment.
- Narration-3 on first enter.
- Content: 2 project cards that slide/fade in on scroll:
  1. **AI-Powered Workflow Automation** — n8n + Zapier workflows connecting web forms, email, Google Sheets, and AI services; intelligent routing and data extraction.
  2. **Pharmacy Management System** — full-stack app with authentication, inventory, prescriptions, billing, analytics dashboard; AI-assisted development.
- Cards: dark glass (backdrop-blur), thin gold border on hover, small tech-tag chips.

### 6. Hub — scene-4 (navigation)
- Fog-wipe in. `scene-4-hub.png` full viewport, **no Ken Burns here** — this scene stays stable (it is the menu).
- Narration-4 on first enter.
- Overlay text positioned over the four blank stone tablets in the image: **ABOUT**, **PROJECTS**, **SKILLS**, **CONTACT** (serif, engraved look: dark text with a faint gold outer glow). Position with percentage-based coordinates tuned to the image at cover-fit; test at common aspect ratios and keep each label inside its tablet at 16:9. Above the mansion door area, overlay "MUZAMMIL" + "Junior AI Automation Engineer" in the same style.
- Each tablet label is clickable with hover: glow intensifies (text-shadow swell) + cursor ring expands.
  - ABOUT → smooth-scrolls back to the About section
  - PROJECTS → smooth-scrolls back to Projects
  - SKILLS → opens a full-screen overlay modal (dark, blurred backdrop): skill groups as engraved lists — *AI & Automation:* n8n, Zapier, Workflow Automation, AI Agents, Claude, ChatGPT, Prompt Engineering. *Integrations & APIs:* REST APIs, Webhooks, MCP Servers, Google Sheets, Third-Party Integrations. *Development:* JavaScript, HTML, CSS, Git & GitHub. *Tools:* Postman, Windsurf IDE, VS Code.
  - CONTACT → opens a similar overlay: email `muzamilqaiser2001@gmail.com`, LinkedIn `linkedin.com/in/muhammad-muzamil-b421b023b`, location Lahore, Pakistan. Simple mailto link styled as a wax-seal-ish gold button. No form backend.
- Below the fold of this section, the page continues to the Terminal footer.

### 7. Terminal footer — MUZAMMIL.AI

**This is the payoff of the whole journey: the visitor has walked through fog, reached the mansion, and now sits at the keeper's desk inside it. Build it accordingly.**

- Fog-wipe into a final full-viewport scene: `scene-5-terminal.jpeg` as the background (object-fit: cover), so it reads as *stepping inside the mansion*.
- The live terminal renders **inside the CRT monitor's screen in the image** — NOT as a floating rectangle on top of it. This is the single most important requirement of this section. Implementation:
  - Wrap the terminal in a container positioned over the monitor's screen area using percentage coordinates (measured against the image at cover-fit), so it scales with the background. **Measured starting values** (image is 1408×768; the dark glass area sits approximately at): left `47.5%`, top `35%`, width `16.5%`, height `29%`. The screen is angled — its left edge is taller than its right edge. Treat these as a starting point and refine by eye.
  - Apply a CSS 3D transform (`perspective(...) rotateY(...) rotateX(...)` plus a slight `skew` if needed) so the text sits on the same visual plane as the angled screen. Tune the values by eye against the image until the text looks *painted onto the glass*, not pasted above it.
  - The terminal has **no bezel, no border, no background panel of its own** — the monitor in the photograph is the bezel. Only text on the dark glass.
  - Screen glow: while the terminal is "on", add a soft radial glow inside the screen area (phosphor bloom) and a faint light spill onto the desk edge. When the boot sequence starts, animate the screen from fully dark → lit over ~600ms, like a CRT warming up (brief horizontal-line flash, then bloom).
  - Overlay on the screen area only: scanlines (CSS repeating-linear-gradient), a faint flicker (opacity micro-jitter), and a subtle curvature vignette matching the CRT glass.
  - Text: JetBrains Mono, warm amber/gold phosphor (#e8b64c-ish), blinking block cursor. **The screen is small relative to the viewport** — size text so roughly 40–50 characters fit the screen width, and keep boot lines short. If content overflows, scroll it within the screen area (older lines drift up and out), never expand the container beyond the glass.
  - Because the screen is small, on scroll-in, GSAP should slowly push the camera toward the monitor: scale the background image from 1.0 → ~1.35 with transform-origin at the screen's center, so by the time the terminal is interactive, the monitor fills a comfortable portion of the viewport. This "leaning in to the machine" move is the section's main beat.
- Clicking anywhere on the monitor focuses a hidden input, so the visitor can just start typing. Show a small hint the first time: `click the screen to type`.
- Mobile / narrow screens: the 3D-mapped screen becomes unreadable — below 768px, keep `scene-5-terminal.jpeg` as a dimmed background and render the terminal as a flat, centered, readable panel over it (scanlines and glow retained, no 3D transform).
- Header bar: `MUZAMMIL://terminal — v1.0`
- On first scroll into view it auto-types a **boot sequence** (each line appears with a short delay, dotted leaders aligning the status column):
  ```
  loading muzammil data...
  automation engine ......... sync
  workflow registry ......... bound
  mcp handshake ............. ok
  narrator link ............. ready
  ready for user input
  ```
  followed by: `I am MUZAMMIL.AI — the keeper of this estate. Type 'help' to begin.`
- **v1 = fully scripted, no API calls.** Commands (case-insensitive):
  - `help` — lists commands
  - `about` — 2-line bio
  - `projects` — lists the 2 projects, one line each
  - `skills` — comma list by group
  - `contact` — email + LinkedIn
  - `whoami` — playful: "A visitor... the fog brought you here."
  - `clear` — clears the terminal
  - unknown input — "Command not found in the archives. Type 'help'."
- All responses render with a typewriter effect (~20ms/char). Keep an input history (up-arrow).
- Structure the answer logic as a simple `commands` map so a real AI backend can replace it later without touching the UI.

## Global systems

### Audio engine (`useAudioManager`)
Single Web Audio graph created on ENTER click:
- `rain-loop.mp3` → GainNode (base 0.14) → master
- `drone-loop.mp3` → GainNode (base 0.10) → master
- Narrations → their own GainNode (0.9)
- **Ducking:** while any narration plays, tween drone gain to 40% of base and rain to 70% of base (200ms ramps), restore after.
- **Scroll reactivity:** track scroll velocity (px/s, smoothed). Map it to a gentle boost of the drone gain (up to +50% of base) and/or a lowpass filter opening on the rain — subtle; it should feel like wind picking up, not a volume knob.
- **Section color:** at the Hub section, ramp drone gain up slightly (arrival weight). 
- Each narration fires **once per page load** (guard flags).
- Mute toggle button, fixed bottom-right (speaker icon, thin gold outline). Persist preference in a JS variable only (no localStorage — it's blocked in some environments; default unmuted each visit is fine).
- Respect `prefers-reduced-motion`: if set, skip scroll-reactive modulation (keep static beds).

### Custom cursor
- Desktop only (pointer: fine). Hide native cursor.
- Two elements: 6px solid gold dot (instant) + 34px thin gold ring (lerped follow, ~0.12 factor).
- Hover on interactive elements (links, tablets, buttons, terminal): ring expands to 52px and brightens.
- Over the terminal: ring morphs into a text-caret-like vertical bar.
- On touch devices: never initialize; native cursor/touch untouched.

### Fog particles (Three.js)
- One fixed full-viewport canvas above the scene layers, below text overlays. `pointer-events: none`.
- ~120 soft sprite particles (radial-gradient texture generated in code), slow horizontal drift with slight vertical sine, additive-ish low opacity (0.04–0.10), grey-blue.
- Density/opacity increases during fog-wipe transitions (GSAP tweens a uniform/global opacity multiplier).
- Cap DPR at 1.5. On mobile, halve particle count. If WebGL unavailable, fall back to 2–3 large blurred CSS fog divs drifting via CSS animation.

### Film grain + vignette
- Grain: tiny noise PNG generated at runtime on a canvas, tiled, `opacity 0.05`, `mix-blend-mode: overlay`, animated via steps() background-position jitter. Fixed overlay, pointer-events none.
- Vignette: fixed radial-gradient overlay, very subtle.

### Fog-wipe transition (shared utility)
A reusable full-screen fog layer (dense version of the particle look or a big blurred radial CSS layer). GSAP timeline: opacity 0→1 (0.6s), swap underlying scene visibility, 1→0 (0.9s). Optionally play a soft whoosh if `assets/audio/whoosh.mp3` exists — **check for the file; it may not be present. Missing whoosh must not error.**

## Responsive behavior

- Mobile (< 768px): video scrub still works but reduce pinned scroll distance to 200vh; hub tablet labels reflow into a 2×2 grid of tappable stone-styled buttons if the image tablets don't align on tall screens (portrait): render dedicated buttons over the lower third instead of chasing tablet positions.
- All text overlays must remain legible at 375px width.
- Test everything at 1920×1080, 1366×768, and 390×844.

## Performance rules

- Lazy-decode images below the fold (`loading="lazy"` where applicable, but preload during the loading screen anyway since total payload is small).
- Only one video element; never mount duplicate.
- All GSAP ScrollTriggers created once, killed on unmount.
- Target: Lighthouse performance ≥ 85 on desktop, no scroll jank at 60fps on a mid-range laptop.

## Acceptance checklist

1. ENTER click unlocks audio; rain+drone fade in; gate creak plays; gates open; narration-1 plays.
2. Scrolling scrubs the hero video forward AND backward smoothly (no seek stutter).
3. Each of the 4 narrations plays exactly once, at its section, with ducking audible.
4. Fog-wipe transitions between all scenes; no hard cuts.
5. Hub tablets: hover glow + cursor ring expand; ABOUT/PROJECTS scroll, SKILLS/CONTACT open overlays.
6. Terminal: auto-type intro, all commands respond, typewriter effect, blinking cursor, scanlines.
7. Custom cursor on desktop; absent on touch.
8. Grain + vignette + fog particles present throughout; site never drops below ~50fps while scrolling on desktop.
9. Works after `npm run build` + `vercel deploy` (no localStorage, no missing-asset crashes, correct lowercase asset paths).
10. Site is fully usable with audio muted and with `prefers-reduced-motion` (content reachable, nav works).

## Build order (follow strictly, verify each phase before the next)

**Phase 1 — Skeleton.** Vite + React + Tailwind + GSAP + three installed. All sections mounted as empty full-viewport divs in order (Loading → Hero → About → Projects → Hub → Terminal) with visible temp labels. Verify: `npm run dev` renders all sections, scroll flows through them.

**Phase 2 — Hero video scrub.** Implement the pinned hero with ScrollTrigger scrubbing `hero-walk.mp4`. Verify: scrolling down/up moves the man forward/backward smoothly; no console errors; video covers viewport at 1920×1080 and 390×844.

**Phase 3 — Scenes & transitions.** About/Projects/Hub sections with their images, Ken Burns (not on hub), fog-wipe transitions, scroll-revealed content, hub tablet labels positioned and clickable (overlays for SKILLS/CONTACT). Verify: full scroll journey works with no hard cuts; tablet labels sit inside tablets at 16:9.

**Phase 4 — Audio engine.** Loading screen with real preload progress, ENTER unlock, rain+drone beds, gate creak + gate-open animation, 4 narrations with once-only guards and ducking, mute toggle. Verify: acceptance items 1 and 3.

**Phase 5 — Atmosphere.** Three.js fog particles (with CSS fallback), film grain, vignette, custom cursor, scroll-reactive audio modulation. Verify: 60fps scroll on desktop; cursor absent on touch emulation.

**Phase 6 — Terminal.** MUZAMMIL.AI scripted terminal with typewriter, commands map, history. Verify: acceptance item 6.

**Phase 7 — Polish & ship.** Responsive pass (375px, 768px, 1366px, 1920px), reduced-motion pass, `npm run build`, fix any build errors, Lighthouse check. Verify: full acceptance checklist top to bottom.