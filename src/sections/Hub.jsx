import SectionNumeral from '../components/SectionNumeral.jsx';

// SPEC: percentages measured against scene-4-hub.png (2560x1440) at the
// tablets' recessed panel area, tuned by eye. They line up at 16:9, which
// object-cover preserves reasonably well on landscape/desktop widths; on
// narrow portrait screens object-cover crops far more aggressively and
// these percentages drift off the actual stone tablets in the image, so
// below `md:` a dedicated 2x2 grid of stone-styled buttons renders instead
// (over the lower third, not chasing image coordinates at all).
const TABLETS = [
  { id: 'about', label: 'ABOUT', left: '25%', width: '8.5%' },
  { id: 'projects', label: 'PROJECTS', left: '38%', width: '7.5%' },
  { id: 'skills', label: 'SKILLS', left: '55.5%', width: '7%' },
  { id: 'contact', label: 'CONTACT', left: '66%', width: '7.5%' },
];
const TABLET_TOP = '47%';
const TABLET_HEIGHT = '16%';

// Presentational Hub layer: scene-4-hub.png (no Ken Burns, per spec — this
// scene stays stable) + name overlay + tablet buttons. SKILLS/CONTACT modal
// state lives in Experience.jsx since modals must stay interactive
// regardless of this layer's scroll-driven opacity; `onTabletClick` reports
// which tablet was pressed.
export default function Hub({ imgRef, onTabletClick }) {
  return (
    <>
      <SectionNumeral numeral="IV" side="right" />

      <img
        ref={imgRef}
        src="/assets/images/scene-4-hub.webp"
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

      <div className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 px-6 text-center">
        <p className="tablet-label identity-name font-display text-4xl font-bold tracking-[0.22em] sm:text-6xl sm:tracking-[0.28em] md:text-7xl">
          MUZAMMIL
        </p>
        <p className="tablet-label mt-4 font-serif text-xs font-semibold uppercase tracking-[0.4em] sm:mt-5 sm:text-base sm:tracking-[0.55em]">
          Junior AI Automation Engineer
        </p>
      </div>

      {/* Desktop/landscape: labels positioned to sit inside the image's own
          stone tablets. Hidden below md — see the 2x2 grid instead. */}
      {TABLETS.map((tablet) => (
        <button
          key={tablet.id}
          type="button"
          onClick={() => onTabletClick(tablet.id)}
          className="tablet-label absolute hidden cursor-pointer items-center justify-center font-display text-sm tracking-[0.3em] md:flex md:text-base"
          style={{ left: tablet.left, width: tablet.width, top: TABLET_TOP, height: TABLET_HEIGHT }}
        >
          {tablet.label}
        </button>
      ))}

      {/* Mobile/portrait: object-cover crops this image too aggressively for
          the percentage coordinates above to land on the actual tablets, so
          this renders its own dedicated 2x2 grid over the lower third
          instead of chasing image-relative positions. */}
      <div className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-2 gap-3 px-6 pb-10 md:hidden">
        {TABLETS.map((tablet) => (
          <button
            key={tablet.id}
            type="button"
            onClick={() => onTabletClick(tablet.id)}
            className="hub-stone-button flex items-center justify-center py-4"
          >
            <span className="tablet-label font-display text-sm tracking-[0.3em]">{tablet.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
