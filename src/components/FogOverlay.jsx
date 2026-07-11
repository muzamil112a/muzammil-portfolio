import { forwardRef } from 'react';

// SPEC: this is the simple CSS fog-wipe layer only (opacity driven directly
// by scroll progress from Experience's single master ScrollTrigger — it
// flares at each scene boundary and recedes). The particle-based fog canvas
// is a separate Phase 5 system (Three.js) and is not built here.
//
// Positioned `absolute inset-0` (not `fixed`) because it now lives inside
// the pinned canvas in Experience.jsx, which itself fills the viewport for
// the entire scroll journey.
const FogOverlay = forwardRef(function FogOverlay(_props, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 opacity-0"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(130,140,155,0.55) 0%, rgba(8,10,14,0.94) 75%)',
        filter: 'blur(6px)',
      }}
    />
  );
});

export default FogOverlay;
