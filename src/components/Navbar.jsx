import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'hub', label: 'Hub' },
  { id: 'contact', label: 'Contact' },
];

// Top brand bar: wordmark + a compact row of section links. RomanNav.jsx
// (the fixed vertical numeral nav) is the persistent, always-visible nav
// across the whole page including past this canvas into Terminal/Contact;
// this top bar is a second, more familiar entry point that only needs to
// exist over the canvas itself, so having both isn't redundant — RomanNav
// reads as a scroll-progress indicator, this reads as a menu.
// Desktop-only for the link row (matches RomanNav's own `md:` breakpoint);
// mobile keeps just the wordmark, same as before.
export default function Navbar({ onNavClick }) {
  const wordmarkRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    const targets = [wordmarkRef.current, ...itemsRef.current].filter(Boolean);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      targets,
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.08, delay: 0.3 }
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-12">
      <span
        ref={wordmarkRef}
        className="font-display text-xs font-bold tracking-[0.4em] text-gold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
      >
        M. MUZAMMIL
      </span>

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
