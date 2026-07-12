import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SectionNumeral from '../components/SectionNumeral.jsx';
import Fireflies from '../components/Fireflies.jsx';

// SPEC: percentages measured against scene-4-hub.png (2560x1440) at the
// tablets' recessed panel area, tuned by eye. They line up at 16:9, which
// object-cover preserves reasonably well on landscape/desktop widths; on
// narrow portrait screens object-cover crops far more aggressively and
// these percentages drift off the actual stone tablets in the image, so
// below `md:` a dedicated 2x2 grid of stone-styled buttons renders instead
// (over the lower third, not chasing image coordinates at all).
const TABLETS = [
  { id: 'about', label: 'ABOUT', left: '25%', width: '8.5%' },
  { id: 'projects', label: 'EXPERIENCE', left: '38%', width: '7.5%' },
  { id: 'skills', label: 'SKILLS', left: '55.5%', width: '7%' },
  { id: 'contact', label: 'CONTACT', left: '66%', width: '7.5%' },
];
const TABLET_TOP = '47%';
const TABLET_HEIGHT = '16%';

const BASE_EMBER_COUNT = 18;
// Same mobile-halving pattern as Fireflies.jsx/FogParticles.jsx — each ember
// is its own DOM node with an infinite CSS animation, so trimming the count
// on phones is a real (if individually small) compositor-layer saving.
const EMBER_COUNT =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
    ? Math.round(BASE_EMBER_COUNT / 2)
    : BASE_EMBER_COUNT;

// Deterministic scatter (golden-angle spacing keeps it visually random
// without clumping) computed once at module load, not regenerated per
// render — same reasoning/technique as Fireflies.jsx's own generator.
// Embers drift upward with a left-right-left sway (see .hub-ember/
// hub-ember-rise in index.css) rather than a straight vertical rise, and
// read as candle embers off the lanterns rather than the cooler firefly
// dots Fireflies.jsx already scatters across this same scene.
function makeEmbers(count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const seed = i * 137.51;
    list.push({
      left: `${(5 + (seed % 90)).toFixed(1)}%`,
      top: `${(15 + ((seed * 1.7) % 70)).toFixed(1)}%`,
      size: 2 + (i % 3),
      duration: `${8 + (i % 7) * 1.2}s`,
      delay: `${(i % 9) * -1.4}s`,
      opacity: (0.4 + (((i * 7) % 10) / 10) * 0.3).toFixed(2),
    });
  }
  return list;
}

const EMBERS = makeEmbers(EMBER_COUNT);

// Presentational Hub layer: scene-4-hub.png (no Ken Burns, per spec — this
// scene stays stable) + name overlay + tablet buttons. SKILLS/CONTACT modal
// state lives in Experience.jsx since modals must stay interactive
// regardless of this layer's scroll-driven opacity; `onTabletClick` reports
// which tablet was pressed.
export default function Hub({ imgRef, onTabletClick }) {
  const nameRef = useRef(null);
  const subtitleRef = useRef(null);
  const quoteRef = useRef(null);
  const separatorLineRef = useRef(null);
  const desktopTabletRefs = useRef([]);
  const mobileTabletRefs = useRef([]);

  // One-shot entrance on mount (same pattern as Hero.jsx's overlay fade) —
  // Hub itself never unmounts, its crossfade opacity is driven by
  // Experience.jsx's master ScrollTrigger, so this only needs to play once
  // rather than re-trigger on every scroll re-entry.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tablets = [...desktopTabletRefs.current, ...mobileTabletRefs.current].filter(Boolean);
    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo(nameRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' });
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
      '-=0.6'
    );
    // Quote settles at 0.45 opacity (its .hub-quote CSS resting value, not
    // 1) — fromTo's own "from" opacity:0 is what's transient here.
    tl.fromTo(
      quoteRef.current,
      { opacity: 0, y: 10 },
      { opacity: 0.45, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.5'
    );
    tl.fromTo(
      separatorLineRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.9, ease: 'power2.out' },
      '-=0.3'
    );
    if (tablets.length) {
      tl.fromTo(
        tablets,
        { opacity: 0, y: 16, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out', stagger: 0.1 },
        '-=0.4'
      );
    }
    // Cleanup matters even though Hub never unmounts in production: Vite HMR
    // DOES tear down/replace this component in dev, and an orphaned timeline
    // from the torn-down instance can die mid-flight — stranding whichever
    // targets hadn't reached their tween yet at fromTo's opacity-0 "from"
    // state (observed live: all four tablets frozen invisible after two
    // quick successive hot reloads).
    return () => tl.kill();
  }, []);

  return (
    <>
      <SectionNumeral numeral="IV" side="right" />

      {/* scene-4-hub.webp is the single largest image asset (2560px-wide
          source, ~400KB) — scene-4-hub-mobile.webp is a pre-shrunk 1200px
          variant of the same crop, roughly a quarter the size, for phones
          that never need that much resolution on a cropped background. */}
      <picture>
        <source media="(max-width: 768px)" srcSet="/assets/images/scene-4-hub-mobile.webp" />
        <img
          ref={imgRef}
          src="/assets/images/scene-4-hub.webp"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

      <Fireflies />

      {/* Ember particles — candle embers off the lanterns, distinct from
          Fireflies' cooler ambient dots above. Purely decorative, always
          rendered (not part of the one-shot GSAP entrance below). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {EMBERS.map((ember, i) => (
          <span
            key={i}
            className="hub-ember"
            style={{
              left: ember.left,
              top: ember.top,
              width: ember.size,
              height: ember.size,
              animationDuration: ember.duration,
              animationDelay: ember.delay,
              '--ember-opacity': ember.opacity,
            }}
          />
        ))}
      </div>

      {/* Ambient ground mist — a soft static gradient across the bottom
          15%, reads as fog swirling near the man's feet. */}
      <div aria-hidden="true" className="hub-mist pointer-events-none absolute inset-x-0 bottom-0 h-[15%]" />

      <div className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 px-6 text-center">
        {/* Spotlight behind the name — the mansion facade behind it is
            already warm/gold-lit, so a plain gold gradient text-fill was
            reading as near-invisible against it (same tone on tone). Darker
            and wider than before, plus a slow breathing pulse, so this
            reads as a deliberate pool of shadow the name sits in rather
            than a token vignette. */}
        <div
          aria-hidden="true"
          className="glow-breathe absolute left-1/2 top-1/2 -z-10 h-[190%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(3,4,6,0.82) 0%, rgba(3,4,6,0.45) 45%, rgba(3,4,6,0.12) 68%, rgba(3,4,6,0) 82%)' }}
        />
        <p
          ref={nameRef}
          className="identity-name font-display text-4xl font-bold tracking-[0.22em] sm:text-6xl sm:tracking-[0.28em] md:text-7xl"
        >
          MUZAMMIL
        </p>
        <p
          ref={subtitleRef}
          className="tablet-label identity-subtitle mt-4 font-serif text-xs font-semibold uppercase tracking-[0.3em] sm:mt-5 sm:text-base sm:tracking-[0.4em]"
        >
          Quality Assurance · UI/UX · SEO · Operations
        </p>
        {/* Small italic line — pure atmosphere, not a real quote/attribution.
            Lives INSIDE this block's normal flow (not absolutely positioned
            against the section) so it stacks under the subtitle at any
            viewport height instead of landing on top of it. */}
        <p
          ref={quoteRef}
          className="hub-quote mt-3 whitespace-nowrap font-display text-[0.9rem] italic tracking-[0.08em] text-gold sm:mt-4"
        >
          — every door here was built by hand —
        </p>
      </div>

      {/* Thin separator line, centered, sitting just above the tablet row. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[43%] w-[40%] max-w-xs -translate-x-1/2"
      >
        <div
          ref={separatorLineRef}
          className="hub-separator-line h-px w-full"
          style={{ background: 'rgba(201,162,39,0.5)', boxShadow: '0 0 6px rgba(201,162,39,0.45)' }}
        />
      </div>

      {/* Desktop/landscape: labels positioned to sit inside the image's own
          stone tablets. Hidden below md — see the 2x2 grid instead. */}
      {TABLETS.map((tablet, i) => (
        <button
          key={tablet.id}
          type="button"
          onClick={() => onTabletClick(tablet.id)}
          ref={(el) => {
            desktopTabletRefs.current[i] = el;
          }}
          className="tablet-label absolute hidden cursor-pointer items-center justify-center font-display text-sm tracking-[0.3em] transition-transform duration-300 hover:-translate-y-1 active:translate-y-0 md:flex md:text-base"
          style={{ left: tablet.left, width: tablet.width, top: TABLET_TOP, height: TABLET_HEIGHT, '--tablet-i': i }}
        >
          {/* Chapter-style index — thin/dim on purpose, well under the
              label's own contrast so it reads as a detail, not content. */}
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 font-serif text-[10px] text-gold"
            style={{ opacity: 0.35, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="tablet-plate">{tablet.label}</span>
        </button>
      ))}

      {/* Mobile/portrait: object-cover crops this image too aggressively for
          the percentage coordinates above to land on the actual tablets, so
          this renders its own dedicated 2x2 grid over the lower third
          instead of chasing image-relative positions. */}
      <div className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-2 gap-3 px-6 pb-10 md:hidden">
        {TABLETS.map((tablet, i) => (
          <button
            key={tablet.id}
            type="button"
            onClick={() => onTabletClick(tablet.id)}
            ref={(el) => {
              mobileTabletRefs.current[i] = el;
            }}
            className="hub-stone-button group flex flex-col items-center justify-center gap-2 py-4 transition-transform duration-300 active:scale-95"
          >
            <span className="tablet-label font-display text-sm tracking-[0.3em]">{tablet.label}</span>
            <span
              aria-hidden="true"
              className="h-1 w-1 rotate-45 bg-gold-faint transition-colors duration-300 group-hover:bg-gold-dim"
            />
          </button>
        ))}
      </div>
    </>
  );
}
