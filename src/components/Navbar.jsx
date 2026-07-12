import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Experience' },
  { id: 'hub', label: 'Hub' },
  { id: 'contact', label: 'Contact' },
];

// Cap on the mouse-tracked 3D tilt below — kept modest (unlike Projects
// cards' 8deg) since this tilts short text (wordmark + link labels), not an
// isolated card; anything more starts to blur the letterforms.
const TILT_MAX_DEG = 3;

// Top brand bar: wordmark + a compact row of section links. Mounted at the
// App root (a fixed-position sibling, same as RomanNav.jsx/DiamondNav.jsx)
// rather than inside Experience.jsx's sticky canvas, so it stays on screen
// all the way through Contact and Terminal too instead of disappearing once
// scrolled past the canvas. RomanNav is a second, persistent entry point
// that reads as a scroll-progress indicator; this top bar reads as a menu —
// having both isn't redundant.
// Desktop-only for the link row (matches RomanNav's own `md:` breakpoint);
// mobile keeps just the wordmark, same as before.
export default function Navbar({ onNavClick }) {
  const containerRef = useRef(null);
  const wordmarkRef = useRef(null);
  const itemsRef = useRef([]);

  // Entrance: the whole bar "hinges" down into place (rotateX from a steep
  // angle, pivoting from its own top edge) like a glass visor lowering,
  // concurrent with the existing wordmark/link stagger fade — two
  // independent tweens on different targets/properties, so they don't
  // fight each other.
  useEffect(() => {
    const targets = [wordmarkRef.current, ...itemsRef.current].filter(Boolean);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(targets, { opacity: 1, y: 0 });
      gsap.set(containerRef.current, { opacity: 1, rotateX: 0 });
      return;
    }
    const tl = gsap.timeline({ delay: 0.3 });
    tl.fromTo(
      containerRef.current,
      { opacity: 0, rotateX: -28, transformPerspective: 800, transformOrigin: 'top center' },
      { opacity: 1, rotateX: 0, duration: 1, ease: 'power3.out' },
      0
    );
    tl.fromTo(
      targets,
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.08 },
      0.15
    );
  }, []);

  // Mouse-tracked 3D tilt on the whole bar, reacting to cursor position
  // globally (not a per-element :hover) — the container is `pointer-events:
  // none` on purpose (most of the bar's area needs clicks to pass through
  // to the video/scene beneath it), so a window-level listener is the only
  // way to track the cursor here at all; it just no-ops whenever the
  // cursor isn't within/near the bar's own vertical band. Desktop-only
  // (pointer: fine), same gate CustomCursor.jsx uses, since there's no
  // persistent "cursor position" to track on touch. Direct style writes
  // rather than React state, for the same reason Projects.jsx's card tilt
  // and CustomCursor avoid state: this needs to update every mousemove
  // without triggering a re-render.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    function resetTilt() {
      el.style.transitionProperty = 'transform';
      el.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
    }

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      if (e.clientY < rect.top - 10 || e.clientY > rect.bottom + 60) {
        resetTilt();
        return;
      }
      const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(rect.height, 1)));
      const rotateY = (px - 0.5) * TILT_MAX_DEG * 2;
      const rotateX = (0.5 - py) * TILT_MAX_DEG * 2;
      el.style.transitionProperty = 'none';
      el.style.transform = `perspective(1400px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    }

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="navbar-3d pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-12"
    >
      <div aria-hidden="true" className="navbar-glass">
        <div aria-hidden="true" className="navbar-shine" />
      </div>
      {/* The wordmark doubles as a "home" link — clicking it scrolls back to
          Hero, same handler NAV_ITEMS' own "Home" entry already uses. */}
      <button
        type="button"
        ref={wordmarkRef}
        onClick={() => onNavClick?.('hero')}
        className="pointer-events-auto font-display text-xs font-bold tracking-[0.4em] text-gold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] transition-opacity duration-300 hover:opacity-75"
      >
        M. MUZAMMIL
      </button>

      <nav className="hidden items-center gap-8 md:flex">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavClick?.(item.id)}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            className="navbar-link pointer-events-auto font-serif text-xs uppercase tracking-[0.3em] text-white/60 transition-colors duration-300 hover:text-gold"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
