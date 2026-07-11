import { useEffect, useRef } from 'react';

// SPEC: desktop only (pointer: fine); hides the native cursor via the
// `.custom-cursor` body class already defined in index.css. Two elements:
// a small solid dot that tracks the raw mouse position instantly, and a
// larger blurred glow that lags behind it (lerped), giving the trail its
// soft/hazy look. Ring brightens + expands over interactive elements.
//
// Both elements are written to in a single rAF tick (not inside the
// mousemove handler) so DOM writes are capped at one-per-frame instead of
// one-per-event, and every lerp is corrected by the frame's actual elapsed
// time so speeds stay consistent across refresh rates (a 144Hz display
// would otherwise ease in ~2.4x faster than 60Hz).
//
// The ring's size and opacity on hover are driven through this same
// per-frame transform/opacity write — NOT a CSS width/height transition —
// on purpose: animating width/height triggers layout (reflow) on every
// step, fighting the transform-only (compositor-only, no reflow) position
// tracking running on the same element every frame. Scaling via
// `transform: scale()` instead keeps everything on one consistent,
// GPU-composited animation path, which is what actually fixes "clunky"
// rather than just retuning numbers.
const RING_SIZE = 30;
const RING_HOVER_SIZE = 48;
const RING_SCALE_MIN = RING_SIZE / RING_HOVER_SIZE;
const DOT_SIZE = 7;
const POSITION_LERP_PER_60FPS_FRAME = 0.2;
const SCALE_LERP_PER_60FPS_FRAME = 0.18;
const OPACITY_LERP_PER_60FPS_FRAME = 0.18;
const MAX_DT = 1 / 20; // clamp so a stalled tab doesn't jump-cut the ring on resume
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, [role="button"]';

function frameLerp(current, target, perFrameFactor, dt) {
  const factor = 1 - (1 - perFrameFactor) ** (dt * 60);
  return current + (target - current) * factor;
}

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    document.body.classList.add('custom-cursor');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let ringScale = RING_SCALE_MIN;
    let ringOpacity = 0.7;
    let hovering = false;
    let rafId = null;
    let lastTime = performance.now();

    function onMouseMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      hovering = Boolean(e.target.closest?.(INTERACTIVE_SELECTOR));
    }

    function tick(now) {
      const dt = Math.min(MAX_DT, (now - lastTime) / 1000);
      lastTime = now;

      ringX = frameLerp(ringX, targetX, POSITION_LERP_PER_60FPS_FRAME, dt);
      ringY = frameLerp(ringY, targetY, POSITION_LERP_PER_60FPS_FRAME, dt);
      ringScale = frameLerp(ringScale, hovering ? 1 : RING_SCALE_MIN, SCALE_LERP_PER_60FPS_FRAME, dt);
      ringOpacity = frameLerp(ringOpacity, hovering ? 1 : 0.7, OPACITY_LERP_PER_60FPS_FRAME, dt);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;
        ringRef.current.style.opacity = String(ringOpacity);
      }
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove('custom-cursor');
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[60] rounded-full border border-gold-dim will-change-transform"
        style={{
          width: RING_HOVER_SIZE,
          height: RING_HOVER_SIZE,
          filter: 'blur(2.5px)',
          opacity: 0.7,
          transform: `scale(${RING_SCALE_MIN})`,
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[60] rounded-full bg-gold will-change-transform"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          boxShadow: '0 0 10px 3px rgba(201,162,39,0.65)',
          filter: 'blur(0.4px)',
        }}
      />
    </>
  );
}
