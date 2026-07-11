import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SectionNumeral from '../components/SectionNumeral.jsx';

// Presentational hero layer: the scroll-scrubbed video + name/title overlay.
// All scroll-driven behavior (this layer's own fade in/out, the video's
// currentTime scrub) is orchestrated centrally by Experience.jsx, which owns
// the single master ScrollTrigger for the whole journey. `videoRef` is
// wired up there. This component only keeps its own small entrance fade for
// the overlay text on mount (standing in for the Phase 4 gate-open cue).
export default function Hero({ videoRef }) {
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
      <SectionNumeral numeral="I" side="right" />

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
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: 'inset(10% 0 0 0)' }}
        muted
        playsInline
        preload="auto"
        src="/assets/video/hero-walk.mp4"
      />

      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-6 text-center"
      >
        <h1 className="hero-name-shimmer font-serif text-4xl tracking-[0.15em] sm:text-6xl sm:tracking-[0.3em]">
          MUHAMMAD MUZAMMIL
        </h1>
        <p className="font-serif text-xs uppercase tracking-[0.35em] text-gold-dim sm:text-sm sm:tracking-[0.5em]">
          Junior AI Automation Engineer
        </p>
      </div>
    </>
  );
}
