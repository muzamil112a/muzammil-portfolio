import { useEffect, useRef, useState } from 'react';

// Fixed bottom-right, stacked above MuteToggle (same "born near the
// bottom-right corner, appears once there's a reason to" placement) — the
// arrow appears once the visitor reaches Terminal (the actual page footer)
// and offers a quick way back to Hero instead of a long manual scroll up.
// Bidirectional via IntersectionObserver on #terminal, not a one-shot
// reveal — same reasoning as the ambient audio's own footer fade
// (useAudioManager.js's setFooterActive): scrolling back out of Terminal
// should hide it again, not leave it stuck on screen for the rest of the
// page. Always mounted (never conditionally rendered away) so the
// opacity/transform show-hide can actually transition instead of popping.
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.getElementById('terminal');
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setVisible(entry.isIntersecting));
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: reducedMotionRef.current ? 'auto' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className="fixed bottom-20 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold-dim text-gold transition-all duration-500 ease-out hover:border-gold hover:text-gold"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.8)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
