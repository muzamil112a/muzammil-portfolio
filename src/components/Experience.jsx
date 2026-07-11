import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Hero from '../sections/Hero.jsx';
import About from '../sections/About.jsx';
import Projects from '../sections/Projects.jsx';
import Hub from '../sections/Hub.jsx';
import FilmGrain from './FilmGrain.jsx';
import FogOverlay from './FogOverlay.jsx';
import FogParticles from './FogParticles.jsx';
import Navbar from './Navbar.jsx';
import OverlayModal from './OverlayModal.jsx';
import Vignette from './Vignette.jsx';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Single sticky-canvas architecture (aliabyer.dev-style): the canvas is the
// FIRST child inside a tall wrapper and holds itself in the viewport
// with CSS `position: sticky; top: 0` for the whole scroll journey — no GSAP
// pin. Hero/About/Projects/Hub are layers stacked inside it (all absolute
// inset-0, 100vw x 100vh) that crossfade into each other as the user scrolls,
// driven by ONE master ScrollTrigger that is now a pure scroll-progress reader
// (no pin/pinSpacing). The 4 plain divs after the canvas exist only to give
// the wrapper its scroll distance — they render no content and never
// intercept clicks.
//
// SPEC (responsive behavior): reduce the hero's pinned scroll distance to
// 200vh on mobile (< 768px) rather than the desktop 300vh — computed once
// per mount (matches the same one-time `matchMedia` pattern used elsewhere
// in this file/FogParticles.jsx, not a resize-reactive value) since revisiting
// this mid-scroll on an actual device rotation is a rare edge case.
function computeVhLayout() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const HERO_VH = isMobile ? 200 : 300;
  const ABOUT_VH = 200;
  const PROJECTS_VH = 200;
  const HUB_VH = 200;
  const TOTAL_VH = HERO_VH + ABOUT_VH + PROJECTS_VH + HUB_VH;

  const HERO_END = HERO_VH / TOTAL_VH;
  const ABOUT_END = (HERO_VH + ABOUT_VH) / TOTAL_VH;
  const PROJECTS_END = (HERO_VH + ABOUT_VH + PROJECTS_VH) / TOTAL_VH;

  const ABOUT_MID = (HERO_END + ABOUT_END) / 2;
  const PROJECTS_MID = (ABOUT_END + PROJECTS_END) / 2;
  const HUB_MID = (PROJECTS_END + 1) / 2;

  return {
    HERO_VH,
    ABOUT_VH,
    PROJECTS_VH,
    HUB_VH,
    HERO_END,
    ABOUT_END,
    PROJECTS_END,
    ABOUT_MID,
    PROJECTS_MID,
    HUB_MID,
  };
}

const CROSSFADE_HALF = 0.06;
const KEN_BURNS_MAX_SCALE = 1.06;
const PARALLAX_MAX_PX = 8;
const LERP_FACTOR = 0.2;
const EPSILON = 0.0005;

// Per-narration voice timing: how long (ms) after first scrolling into a
// section the voice waits before it starts, keyed by narration index. The
// FIRST play of narration-1 comes from Loading.jsx's gate-opening timeline,
// not from scroll — the entry here only covers RE-entering the Hero later
// (Home click / scrolling back up), which replays the line like every other
// section does. Adjust each line's gap independently here — e.g. give a
// section more breathing room by raising its number, or make the voice
// arrive faster by lowering it — without touching scheduleNarration.
const NARRATION_GAPS_MS = {
  1: 900, // Hero (re-entry only; the intro play comes from Loading.jsx)
  2: 900, // About
  3: 900, // Projects
  4: 900, // Hub
};
const DEFAULT_NARRATION_GAP_MS = 900;

// Hero walk-forward pacing (cinematic intro): the character should be
// visibly walking *while* narration-1 is still speaking, not standing frozen
// until it ends. This is a fixed, deliberately slow duration rather than one
// paced off narration-1's own clip length — the source footage (hero-walk.mp4)
// is only ~5s long, and narration-1 can be shorter than that, so pacing the
// hop to the voice line was scrubbing the video faster than its native
// walking speed (reads as "running"). A fixed, generous duration keeps the
// walk itself unhurried regardless of how long the voice line happens to be;
// tune this one constant for a slower/faster feel.
const HERO_WALK_MS = 9000;
// Keeps the walk-hop's target a hair short of HERO_END so it can never
// itself flip `activeIndex` into About (and fire narration-2) while
// narration-1 might still be playing — see handleGateOpened below.
const HERO_WALK_SAFETY = 0.01;

const MAX_SCROLL_VELOCITY = 2500; // px/s mapped to scroll-intensity 1
const SCROLL_INTENSITY_LERP = 0.15;

// Projects-section polish (Phase 3 cleanup): card entrance stagger, line
// draw-in, and index-label parallax are all derived from `projectsLocal`
// (0-1 progress through the Projects section, already computed for Ken
// Burns below) — none of this touches the section's crossfade opacity.
const CARD_STAGGER = 0.08; // local-progress offset between card 1 and card 2
const CARD_ENTRANCE_WINDOW = 0.24;
const CARD_SLIDE_PX = 28;
const LINE_DRAW_WINDOW = 0.16;
const LABEL_MAX_OPACITY = 0.4;
const LABEL_PARALLAX_PX = 14;

// Mirrors my cv.pdf's Technical Skills / Soft Skills / Certifications
// sections one-for-one — keep the two in sync when the CV changes.
const SKILL_GROUPS = [
  {
    title: 'AI & Automation',
    items: ['n8n', 'Zapier', 'Workflow Automation', 'AI Agents', 'Claude', 'ChatGPT', 'Prompt Engineering'],
  },
  {
    title: 'Integrations & APIs',
    items: ['REST APIs', 'Webhooks', 'MCP Servers', 'Google Sheets Integration', 'Third-Party System Integration'],
  },
  { title: 'Development', items: ['JavaScript', 'HTML', 'CSS', 'Git & GitHub'] },
  { title: 'Tools', items: ['Postman', 'Windsurf IDE', 'VS Code'] },
  {
    title: 'Soft Skills',
    items: ['Problem Solving', 'Communication', 'Teamwork', 'Adaptability', 'Analytical Thinking'],
  },
  {
    title: 'Certifications',
    items: ['Microsoft Technology Associate (MTA)', 'Google AI Essentials'],
  },
];

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}
function fadeOutAt(p, boundary, half) {
  return 1 - clamp01((p - (boundary - half)) / (2 * half));
}
function fadeInAt(p, boundary, half) {
  return clamp01((p - (boundary - half)) / (2 * half));
}
function crossfadeIntensity(p, boundary, half) {
  return 1 - clamp01(Math.abs(p - boundary) / half);
}
function localProgress(p, start, end) {
  return clamp01((p - start) / (end - start));
}
function easeOutQuad(t) {
  return t * (2 - t);
}
function setLayerVisibility(el, opacity) {
  if (!el) return;
  el.style.opacity = String(opacity);
  el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
}

const Experience = forwardRef(function Experience({ audio, onActiveSectionChange }, ref) {
  const [
    {
      HERO_VH,
      ABOUT_VH,
      PROJECTS_VH,
      HUB_VH,
      HERO_END,
      ABOUT_END,
      PROJECTS_END,
      ABOUT_MID,
      PROJECTS_MID,
      HUB_MID,
    },
  ] = useState(computeVhLayout);

  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const fogRef = useRef(null);
  const fogParticlesRef = useRef(null);

  const heroLayerRef = useRef(null);
  const aboutLayerRef = useRef(null);
  const projectsLayerRef = useRef(null);
  const hubLayerRef = useRef(null);

  const videoRef = useRef(null);
  const scene2Ref = useRef(null);
  const scene3Ref = useRef(null);
  const scene4Ref = useRef(null);
  const aboutPanelRef = useRef(null);
  const projectCardsRef = useRef([]);
  const projectLineRef = useRef(null);
  const projectLabelsRef = useRef([]);

  const scrollTriggerRef = useRef(null);
  const scrollTweenRef = useRef(null);
  const narrationTimeoutRef = useRef(null);
  const activeSectionIndexRef = useRef(0);
  const heroAutoScrollDoneRef = useRef(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  // Schedules a section's narration to start its configured gap (see
  // NARRATION_GAPS_MS above) after the visitor (re-)enters it, rather than
  // the instant the boundary is crossed — gives the scene a beat to settle
  // before the voice arrives. Narration replays on every entry, in either
  // scroll direction (see the onUpdate call site below) — a single pending-
  // timeout ref (not a per-index map) means entering a *different* section
  // before this one's gap elapses cleanly cancels it via the clearTimeout
  // below, and `audio.playNarration` itself stops any already-playing
  // narration before starting a new one, so two can never overlap.
  function scheduleNarration(index) {
    if (narrationTimeoutRef.current) clearTimeout(narrationTimeoutRef.current);
    const gapMs = NARRATION_GAPS_MS[index] ?? DEFAULT_NARRATION_GAP_MS;
    narrationTimeoutRef.current = setTimeout(() => {
      narrationTimeoutRef.current = null;
      audio.playNarration(index);
    }, gapMs);
  }

  useEffect(() => {
    const video = videoRef.current;
    let duration = 0;
    const setDuration = () => {
      duration = video.duration || 0;
    };
    video.addEventListener('loadedmetadata', setDuration);
    if (video.readyState >= 1) setDuration();

    let targetHeroLocal = 0;
    let currentHeroLocal = 0;
    let rafId = null;
    const applyVideoFrame = () => {
      const diff = targetHeroLocal - currentHeroLocal;
      currentHeroLocal += Math.abs(diff) < EPSILON ? diff : diff * LERP_FACTOR;
      if (duration > 0) video.currentTime = currentHeroLocal * duration;

      if (Math.abs(targetHeroLocal - currentHeroLocal) < EPSILON) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(applyVideoFrame);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let smoothedScrollIntensity = 0;

    let onMouseMove;
    if (window.matchMedia('(pointer: fine)').matches) {
      onMouseMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        const tx = `${-nx * PARALLAX_MAX_PX * 2}px`;
        const ty = `${-ny * PARALLAX_MAX_PX * 2}px`;
        [scene2Ref.current, scene3Ref.current].forEach((img) => {
          if (!img) return;
          img.style.setProperty('--px-x', tx);
          img.style.setProperty('--px-y', ty);
        });
      };
      window.addEventListener('mousemove', onMouseMove);
    }

    // No `pin`/`pinSpacing`: the canvas holds itself in the viewport via CSS
    // `position: sticky; top: 0` (see the render tree below). This trigger is
    // now a pure scroll-progress reader — `self.progress` drives every layer's
    // crossfade opacity in onUpdate. `end: 'bottom bottom'` maps progress 0→1
    // across the wrapper's full 900vh runway.
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;

        const heroOpacity = fadeOutAt(p, HERO_END, CROSSFADE_HALF);
        const scene2Opacity = fadeInAt(p, HERO_END, CROSSFADE_HALF) * fadeOutAt(p, ABOUT_END, CROSSFADE_HALF);
        const scene3Opacity = fadeInAt(p, ABOUT_END, CROSSFADE_HALF) * fadeOutAt(p, PROJECTS_END, CROSSFADE_HALF);
        const scene4Opacity = fadeInAt(p, PROJECTS_END, CROSSFADE_HALF);

        setLayerVisibility(heroLayerRef.current, heroOpacity);
        setLayerVisibility(aboutLayerRef.current, scene2Opacity);
        setLayerVisibility(projectsLayerRef.current, scene3Opacity);
        setLayerVisibility(hubLayerRef.current, scene4Opacity);

        // For RomanNav/DiamondNav: which of the 4 crossfading layers is
        // actually on top right now. Only calls out when it changes (not on
        // every scroll tick, which would re-render them ~60x/sec for no
        // reason) — index 0-3 maps to Hero/About/Projects/Hub.
        const activeIndex = p < HERO_END ? 0 : p < ABOUT_END ? 1 : p < PROJECTS_END ? 2 : 3;
        if (activeIndex !== activeSectionIndexRef.current) {
          activeSectionIndexRef.current = activeIndex;
          onActiveSectionChange?.(activeIndex);

          // Narration replays on every (re-)entry into ANY canvas section
          // (indices 0-3 -> narration 1-4), in EITHER scroll direction —
          // this transition already fires the same way whichever way `p`
          // crossed the boundary, so no separate "scrolling up" handling is
          // needed. Index 0 is included so returning Home replays the Hero
          // line like every other section; it can't double-fire the intro
          // play (Loading.jsx's gate timeline) because this branch only runs
          // when activeIndex CHANGES, and the page both loads and gate-opens
          // already at index 0. Leaving the range before a still-pending
          // narration's gap elapses cancels it, so scrolling straight
          // through a section without lingering doesn't queue up a narration
          // for a section already left behind.
          scheduleNarration(activeIndex + 1);
        }

        const aboutLocal = localProgress(p, HERO_END, ABOUT_END);
        const projectsLocal = localProgress(p, ABOUT_END, PROJECTS_END);
        if (scene2Ref.current) {
          scene2Ref.current.style.setProperty('--kb-scale', 1 + aboutLocal * (KEN_BURNS_MAX_SCALE - 1));
        }
        if (scene3Ref.current) {
          scene3Ref.current.style.setProperty('--kb-scale', 1 + projectsLocal * (KEN_BURNS_MAX_SCALE - 1));
        }

        if (projectLineRef.current) {
          const lineEased = easeOutQuad(clamp01(projectsLocal / LINE_DRAW_WINDOW));
          projectLineRef.current.style.transform = `scaleX(${lineEased})`;
        }
        projectCardsRef.current.forEach((card, i) => {
          if (!card) return;
          const t = easeOutQuad(
            clamp01((projectsLocal - i * CARD_STAGGER) / CARD_ENTRANCE_WINDOW)
          );
          card.style.opacity = String(t);
          card.style.transform = `translateY(${(1 - t) * CARD_SLIDE_PX}px)`;
        });
        projectLabelsRef.current.forEach((label, i) => {
          if (!label) return;
          const t = easeOutQuad(
            clamp01((projectsLocal - i * CARD_STAGGER) / CARD_ENTRANCE_WINDOW)
          );
          label.style.opacity = String(t * LABEL_MAX_OPACITY);
          label.style.transform = `translateY(${(projectsLocal - 0.5) * -LABEL_PARALLAX_PX}px)`;
        });

        const fogOpacity = Math.max(
          crossfadeIntensity(p, HERO_END, CROSSFADE_HALF),
          crossfadeIntensity(p, ABOUT_END, CROSSFADE_HALF),
          crossfadeIntensity(p, PROJECTS_END, CROSSFADE_HALF)
        );
        if (fogRef.current) fogRef.current.style.opacity = String(fogOpacity);
        fogParticlesRef.current?.setIntensity(fogOpacity);

        targetHeroLocal = localProgress(p, 0, HERO_END);
        if (rafId === null) rafId = requestAnimationFrame(applyVideoFrame);

        // Scroll-reactive audio: map |velocity| to 0-1 and smooth it before
        // handing to the audio engine, so the drone/rain react to "wind
        // picking up" rather than jittering with every scrub tick.
        // prefers-reduced-motion keeps the beds static per SPEC.
        if (!reduceMotion) {
          const rawIntensity = Math.min(1, Math.abs(self.getVelocity()) / MAX_SCROLL_VELOCITY);
          smoothedScrollIntensity += (rawIntensity - smoothedScrollIntensity) * SCROLL_INTENSITY_LERP;
          audio.setScrollIntensity(smoothedScrollIntensity);
        }
        audio.setHubActive(p > PROJECTS_END);
      },
    });
    scrollTriggerRef.current = trigger;

    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      video.removeEventListener('loadedmetadata', setDuration);
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
      cancelAnimationFrame(refreshId);
      trigger.kill();
      if (narrationTimeoutRef.current) clearTimeout(narrationTimeoutRef.current);
    };
    // `audio.playNarration` is a stable useCallback reference (deps: []) that
    // reads current state via refs, so omitting `audio` here is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every scroll-to action anywhere in the app (the cinematic intro
  // auto-scroll, RomanNav clicks, Hub tablet clicks, Terminal/Contact jumps)
  // is funneled through this one helper so there is only ever one scroll-
  // position writer in flight at a time. Two independent scroll engines
  // racing each other — a GSAP ScrollToPlugin tween vs. native
  // `window.scrollTo({behavior:'smooth'})`/`scrollIntoView`, e.g. clicking a
  // RomanNav item while the intro auto-scroll tween was still running —
  // was the root cause of the reported "erratic, repetitive auto-scrolling":
  // killing whatever tween is already in flight before starting a new one
  // closes that gap for every caller, not just the intro.
  function scrollWindowTo(y, opts = {}) {
    scrollTweenRef.current?.kill();
    scrollTweenRef.current = gsap.to(window, {
      duration: opts.duration ?? 1.1,
      scrollTo: { y, autoKill: false },
      ease: opts.ease ?? 'power2.inOut',
    });
    return scrollTweenRef.current;
  }

  // Cinematic auto-scroll: once the gate opens, hops through every section
  // in order — Hero, About, Projects, Hub, Contact, then the unindicated
  // Terminal footer — but stays LOCKED at each narrated section until that
  // section's voice-over has completely finished (SPEC: "the global
  // auto-scroll routine must be securely locked while audio playback is
  // active" / "explicitly blocked ... until the current section's narrator
  // has completely finished speaking"). It does not trigger narration
  // itself — the existing scroll-driven `scheduleNarration` above already
  // fires 2/3/4 automatically as `activeIndex` crosses each boundary during
  // a hop, and narration-1 is started by Loading.jsx's own gate timeline
  // before 'gate-opened' even fires — this orchestrator only *waits* on
  // `audio.hasNarrationCompleted`/`'narration-end'`, race-safe against
  // narration-1 possibly finishing before this listener attaches.
  //
  // Cancels immediately on any manual scroll input so it never fights the
  // visitor — this is a hands-off intro, not a scroll-jack. A click during
  // this window (RomanNav/DiamondNav/Hub) is handled by scrollWindowTo()
  // above killing whatever tween is in flight before starting its own.
  // Skipped entirely under prefers-reduced-motion.
  //
  // heroAutoScrollDoneRef makes this idempotent: live debugging turned up
  // 'gate-opened' occasionally dispatching a second time in immediate
  // succession with the first auto-scroll's own completion (the exact
  // trigger wasn't pinned down, but reproduced consistently enough to guard
  // against directly rather than chase further) — without this guard, a
  // second dispatch would re-run the whole sequence from scratch.
  useEffect(() => {
    function handleGateOpened() {
      if (heroAutoScrollDoneRef.current) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const trigger = scrollTriggerRef.current;
      if (!trigger) return;
      heroAutoScrollDoneRef.current = true;

      // 'gate-opened' now fires EARLY in Loading.jsx's gate timeline (t≈0.4s,
      // same beat as narration-1) so the walk below runs while the doors are
      // still sliding open — Loading's own no-scroll cleanup effect won't run
      // until its 'done' stage ~2s later, so lift the scroll lock here or the
      // walk tween would fight a hidden-overflow body for its first seconds.
      document.body.classList.remove('no-scroll');

      let cancelled = false;
      let pendingNarrationCleanup = null;

      const cancel = () => {
        cancelled = true;
        scrollTweenRef.current?.kill();
        if (pendingNarrationCleanup) {
          pendingNarrationCleanup();
          pendingNarrationCleanup = null;
        }
        window.removeEventListener('wheel', cancel);
        window.removeEventListener('touchstart', cancel);
        window.removeEventListener('keydown', cancel);
      };
      window.addEventListener('wheel', cancel, { passive: true });
      window.addEventListener('touchstart', cancel, { passive: true });
      window.addEventListener('keydown', cancel);

      function hop(y, opts = {}) {
        return new Promise((resolve) => {
          const tween = scrollWindowTo(y, {
            duration: opts.duration ?? 1.8,
            ease: opts.ease ?? 'power2.inOut',
          });
          tween.eventCallback('onComplete', resolve);
          tween.eventCallback('onInterrupt', resolve);
        });
      }

      function waitForNarration(index) {
        if (audio.hasNarrationCompleted(index)) return Promise.resolve();
        return new Promise((resolve) => {
          function handler(e) {
            if (e.detail.index !== index) return;
            window.removeEventListener('narration-end', handler);
            pendingNarrationCleanup = null;
            resolve();
          }
          window.addEventListener('narration-end', handler);
          pendingNarrationCleanup = () => window.removeEventListener('narration-end', handler);
        });
      }

      (async () => {
        // Hero: narration-1 is already playing (or already finished) by the
        // time this fires. Walk the character forward *while* it's still
        // speaking rather than freezing until it ends, at a fixed, slow pace
        // (HERO_WALK_MS) rather than one derived from the voice line's
        // length. The target stops just short of HERO_END (see
        // HERO_WALK_SAFETY) so this hop alone can never cross into About and
        // fire narration-2 early; Promise.all makes sure both the walk AND
        // the narration are done before the short second hop below actually
        // crosses that boundary.
        const heroBoundaryFraction = HERO_END - HERO_WALK_SAFETY;

        await Promise.all([
          hop(trigger.start + (trigger.end - trigger.start) * heroBoundaryFraction, {
            duration: HERO_WALK_MS / 1000,
            ease: 'power1.inOut',
          }),
          waitForNarration(1),
        ]);
        if (cancelled) return;

        // Narration-1 is guaranteed finished now, so crossing HERO_END here
        // (and the narration-2 schedule that triggers) is correct/expected.
        const remainingFraction = ABOUT_MID - heroBoundaryFraction;
        const proportionalMs = (HERO_WALK_MS * remainingFraction) / heroBoundaryFraction;
        await hop(trigger.start + (trigger.end - trigger.start) * ABOUT_MID, {
          duration: Math.max(0.9, Math.min(1.8, proportionalMs / 1000)),
          ease: 'power2.inOut',
        });
        if (cancelled) return;
        await waitForNarration(2);
        if (cancelled) return;

        await hop(trigger.start + (trigger.end - trigger.start) * PROJECTS_MID);
        if (cancelled) return;
        await waitForNarration(3);
        if (cancelled) return;

        await hop(trigger.start + (trigger.end - trigger.start) * HUB_MID);
        if (cancelled) return;
        await waitForNarration(4);
        if (cancelled) return;

        // Contact/Terminal have no narration audio — proceed straight
        // through with no gating, matching SPEC's listed final leg of the
        // journey ("... -> Contact -> Footer").
        const contactEl = document.getElementById('contact');
        if (contactEl) await hop(contactEl.getBoundingClientRect().top + window.scrollY);
        if (cancelled) return;

        const terminalEl = document.getElementById('terminal');
        if (terminalEl) await hop(terminalEl.getBoundingClientRect().top + window.scrollY);
      })().finally(() => {
        if (!cancelled) cancel();
      });
    }

    window.addEventListener('gate-opened', handleGateOpened);
    return () => window.removeEventListener('gate-opened', handleGateOpened);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [HERO_END, ABOUT_MID, PROJECTS_MID, HUB_MID]);

  function scrollToFraction(fraction) {
    const trigger = scrollTriggerRef.current;
    if (!trigger) return;
    const y = trigger.start + (trigger.end - trigger.start) * fraction;
    scrollWindowTo(y);
  }

  function handleTabletClick(id) {
    if (id === 'hero') scrollToFraction(0);
    else if (id === 'about') scrollToFraction(ABOUT_MID);
    else if (id === 'projects') scrollToFraction(PROJECTS_MID);
    else if (id === 'hub') scrollToFraction(HUB_MID);
    else if (id === 'skills') setSkillsOpen(true);
    else if (id === 'terminal' || id === 'contact') {
      const el = document.getElementById(id);
      if (!el) return;
      scrollWindowTo(el.getBoundingClientRect().top + window.scrollY);
    }
  }

  // Exposes handleTabletClick to RomanNav.jsx, a sibling under App.jsx (not
  // a child of Experience), which needs to trigger these same section-scroll
  // actions but can't call a plain prop function across siblings — an
  // imperative ref via the common parent is the standard way to bridge that.
  useImperativeHandle(ref, () => ({ scrollToSection: handleTabletClick }));

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">
        {/* Canvas is the FIRST child and stays in the viewport via CSS sticky
            for the whole runway. The 4 spacers AFTER it supply the 900vh of
            scroll distance the master ScrollTrigger reads progress from. */}
        <div ref={canvasRef} className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* Inline initial opacity/pointerEvents match setLayerVisibility's
            output at scroll progress 0 (hero visible, rest hidden) — without
            this, all 4 layers sit at their CSS-default opacity 1 until the
            first ScrollTrigger onUpdate fires a frame after mount, and since
            hubLayerRef is last in DOM order it paints on top of Hero for
            that one frame (visible as Hub flashing before the video does). */}
        {/* will-change: opacity keeps each crossfading layer on its own
            compositor layer — their opacity is rewritten on every scroll
            tick by setLayerVisibility, and without the hint the browser
            repaints the full stacked canvas each tick instead of just
            re-blending cached layers. */}
        <div
          ref={heroLayerRef}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 1, willChange: 'opacity' }}
        >
          <Hero videoRef={videoRef} />
        </div>
        <div
          ref={aboutLayerRef}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0, pointerEvents: 'none', willChange: 'opacity' }}
        >
          <About imgRef={scene2Ref} panelRef={aboutPanelRef} />
        </div>
        <div
          ref={projectsLayerRef}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0, pointerEvents: 'none', willChange: 'opacity' }}
        >
          <Projects
            imgRef={scene3Ref}
            cardsRef={projectCardsRef}
            lineRef={projectLineRef}
            labelsRef={projectLabelsRef}
          />
        </div>
        <div
          ref={hubLayerRef}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0, pointerEvents: 'none', willChange: 'opacity' }}
        >
          <Hub imgRef={scene4Ref} onTabletClick={handleTabletClick} />
        </div>

        <FogParticles ref={fogParticlesRef} />
        <FogOverlay ref={fogRef} />
        <FilmGrain />
        <Vignette />

        <Navbar onNavClick={handleTabletClick} />

        {skillsOpen && (
          <OverlayModal title="SKILLS" onClose={() => setSkillsOpen(false)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {SKILL_GROUPS.map((group) => (
                <div key={group.title} className="skill-card">
                  <h4 className="font-serif text-xs uppercase tracking-[0.25em] text-gold-dim">{group.title}</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span key={item} className="skill-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </OverlayModal>
        )}
        </div>

        <div className="pointer-events-none" aria-hidden="true" style={{ height: `${HERO_VH}vh` }} />
        <div className="pointer-events-none" aria-hidden="true" style={{ height: `${ABOUT_VH}vh` }} />
        <div className="pointer-events-none" aria-hidden="true" style={{ height: `${PROJECTS_VH}vh` }} />
        <div className="pointer-events-none" aria-hidden="true" style={{ height: `${HUB_VH}vh` }} />
      </div>
    </>
  );
});

export default Experience;
