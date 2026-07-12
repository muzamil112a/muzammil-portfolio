import SectionNumeral from '../components/SectionNumeral.jsx';

// Presentational About layer: scene-2.png + bio panel. Ken Burns scale and
// mouse parallax on `imgRef` are driven centrally by Experience.jsx's master
// ScrollTrigger (via the --kb-scale/--px-x/--px-y CSS custom properties);
// this layer's own opacity (fade in/out with the scene) is set on its
// wrapper div by Experience too, so the panel just sits at full opacity
// here and fades as part of the whole layer.
//
// `mobile`: Experience.jsx's mobile path never writes --kb-scale/--px-x/
// --px-y (no scroll-scrub driving them there), so the transform below is
// already an inert no-op on phones via its own `var(..., fallback)` values —
// Ken Burns/parallax don't need a separate disable path. What mobile DOES
// need is larger, unclipped text: bumps the panel's copy up a size and
// switches SectionNumeral to its IntersectionObserver-driven reveal (this
// section is now a real, independently-scrolled-into document-flow section
// on mobile, not a crossfading layer riding an ancestor's opacity).
export default function About({ imgRef, panelRef, mobile = false }) {
  return (
    <>
      <SectionNumeral numeral="II" side="right" observe={mobile} />

      {/* scene-2-mobile.webp is a pre-shrunk (1200px-wide) variant of the
          same crop — phones don't need the full desktop resolution for a
          background that's cropped down to a narrow portrait slice anyway,
          and it cuts this image's payload by roughly half. */}
      <picture>
        <source media="(max-width: 768px)" srcSet="/assets/images/scene-2-mobile.webp" />
        <img
          ref={imgRef}
          src="/assets/images/scene-2.webp"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          style={{
            transform: 'translate(var(--px-x, 0px), var(--px-y, 0px)) scale(var(--kb-scale, 1))',
            willChange: 'transform',
          }}
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(150,160,175,0.32) 0%, rgba(8,10,14,0) 65%)',
          filter: 'blur(10px)',
        }}
      />

      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex items-end ${
          mobile ? 'px-5 pb-12' : 'px-6 pb-16 sm:px-16 sm:pb-20'
        }`}
      >
        <div
          ref={panelRef}
          className={`relative overflow-hidden rounded-sm border border-gold-faint bg-black/50 backdrop-blur-sm ${
            mobile ? 'w-full p-6' : 'max-w-md p-8'
          }`}
        >
          {/* Gold top hairline — same accent language as the Projects cards
              and the Contact form panel, so every glass panel on the site
              shares one signature. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-dim to-transparent opacity-70"
          />
          <h2 className={`font-display tracking-[0.35em] text-gold ${mobile ? 'text-3xl' : 'text-2xl'}`}>ABOUT</h2>
          <div aria-hidden="true" className="mt-4 flex items-center gap-3 text-gold-faint">
            <span className="h-px w-10 bg-current" />
            <span className="h-1 w-1 rotate-45 bg-current" />
          </div>
          {/* Copy mirrors Profile.pdf's Summary / Experience / Education —
              keep in sync when the profile changes. Mobile text bumps up a
              size (base -> lg) since there's no cramped 100vh canvas forcing
              it small anymore — the section can grow past one screen height
              (.viewport-full-min, not the exact-height .viewport-full) if the
              larger text needs the room. */}
          <p className={`mt-6 font-serif leading-relaxed text-white/80 ${mobile ? 'text-lg' : 'text-base'}`}>
            Software Engineering graduate (University of Lahore, 2021–2025). Currently
            supporting NOC operations for Tech Direct Support in Australia, and working
            as a Search Engine Optimizer at Wanile Technologies, Lahore.
          </p>
          <p className={`mt-5 font-serif leading-relaxed text-white/80 ${mobile ? 'text-lg' : 'text-base'}`}>
            Brings Quality Assurance to the table — software testing, bug
            identification, and usability improvements — built on a foundation in
            UI/UX design, so interfaces stay as functional as they are user-friendly.
            Currently building out SEO fundamentals: keyword research, on-page and
            technical SEO, and link-building strategies.
          </p>
          <p
            className={`mt-5 font-serif uppercase tracking-[0.2em] text-gold-dim ${mobile ? 'text-sm' : 'text-xs'}`}
          >
            Communication · Client Relations · Operations Management
          </p>
        </div>
      </div>
    </>
  );
}
