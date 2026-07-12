import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SectionNumeral from '../components/SectionNumeral.jsx';
import LightningFlash from '../components/LightningFlash.jsx';
import ScrambleText from '../components/ScrambleText.jsx';

// Presentational hero layer: the scroll-scrubbed video + name/title overlay,
// plus the occasional distant-lightning strobe (LightningFlash). All
// scroll-driven behavior (this layer's own fade in/out, the video's
// currentTime scrub) is orchestrated centrally by Experience.jsx, which owns
// the single master ScrollTrigger for the whole journey. `videoRef` is
// wired up there. This component only keeps its own small entrance fade for
// the overlay text on mount (standing in for the Phase 4 gate-open cue).
//
// `mobile`: below 768px there's no pinned canvas or scroll-scrub driving the
// video at all (Experience.jsx's mobile path renders sections in normal
// document flow instead) — scrubbing a video frame-by-frame only makes sense
// tied to a scroll position that no longer exists there, and decoding/
// buffering the full clip is pure cost for a frame nobody drives. This just
// renders hero-poster.webp (the video's own frame 0, already generated and
// used as the desktop video's poster) as a plain static image instead.
export default function Hero({ videoRef, audio, isHeroActive, mobile = false }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      overlayRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }
    );
  }, []);

  return (
    <>
      <SectionNumeral numeral="I" side="right" observe={mobile} />

      {mobile ? (
        <img
          src="/assets/images/hero-poster.webp"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: 'inset(10% 0 0 0)' }}
        />
      ) : (
        <>
          {/* hero-walk.mp4 has a small "Ai" watermark baked into its top-left
              corner (confirmed by extracting a frame — it's in the source file
              itself, not a stray asset reference or CSS overlay). Cropped out
              with clip-path rather than re-encoding. Using a percentage instead
              of a fixed px value on purpose: object-cover already crops this
              video differently depending on viewport aspect ratio (wide desktop
              viewports crop more off the top before this even applies; tall/
              narrow ones crop the sides and leave the full top edge, watermark
              included, visible) — a percentage of this element's own rendered
              box scales correctly at every size, where a fixed px amount would
              under-crop on some viewports and over-crop on others. 10% clears
              the watermark (measured at ~7.6% of the source frame's height)
              with a safety margin; the sliver it hides is otherwise just plain
              dark sky, so no visible content is lost. */}
          {/* poster: the scroll-scrub only ever sets currentTime once real data
              has buffered (Experience.jsx), so without this the very first frame
              the visitor sees is solid black for however long that buffering
              takes — a still of the video's own frame 0 closes that gap. */}
          {/* No `src` here on purpose — Experience.jsx assigns it programmatically
              from preloadAssets' already-downloaded bytes (utils/videoCache.js)
              so the browser doesn't fetch this 5MB file a second time over the
              network. A static `src` attribute here would start its own fetch
              the instant this element mounts, before that logic gets a chance to
              run, defeating the whole point. */}
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: 'inset(10% 0 0 0)' }}
            muted
            playsInline
            preload="auto"
            poster="/assets/images/hero-poster.webp"
          />
        </>
      )}

      {/* z-[5]: above the video, below the z-10 name overlay — the flash
          brightens the scene, never the text. */}
      <LightningFlash audio={audio} isHeroActive={isHeroActive} />

      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-6 text-center"
      >
        <h1 className="hero-name-shimmer font-serif text-4xl tracking-[0.15em] sm:text-6xl sm:tracking-[0.3em]">
          <ScrambleText text="MUHAMMAD MUZAMMIL" delay={300} />
        </h1>
        <p className="font-serif text-xs uppercase tracking-[0.35em] text-gold-dim sm:text-sm sm:tracking-[0.5em]">
          Quality Assurance · UI/UX Designer · SEO · Operations (AUS)
        </p>
      </div>
    </>
  );
}
