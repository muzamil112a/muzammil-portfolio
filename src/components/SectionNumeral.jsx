import { useEffect, useRef, useState } from 'react';

// Glowing Roman numeral marking each section. Two ways to become visible:
//
// - `observe` (Terminal, Contact — plain document-flow sections that
//   genuinely scroll into and out of the viewport): uses a real
//   IntersectionObserver, fading in once and staying in (matches how the
//   rest of the site's one-shot reveals behave, e.g. the terminal's own
//   boot-on-scroll-in trigger).
// - default (Hero/About/Projects/Hub — layers inside Experience.jsx's
//   single sticky canvas that are always technically "in the viewport",
//   just crossfaded via an ancestor's inline `opacity`): no observer at
//   all. Rendering at a flat low opacity lets it inherit the parent
//   layer's own crossfade for free — it fades with the rest of that
//   layer's content instead of needing separately-orchestrated timing.
export default function SectionNumeral({ numeral, side = 'right', observe = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!observe);

  useEffect(() => {
    if (!observe) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [observe]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`section-numeral pointer-events-none absolute top-1/2 z-[5] -translate-y-1/2 ${
        side === 'right' ? 'right-3 sm:right-8' : 'left-3 sm:left-8'
      } ${visible ? 'section-numeral-visible' : ''}`}
    >
      {numeral}
    </div>
  );
}
