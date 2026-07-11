import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';

const BASE_PARTICLE_COUNT = 120;
const MAX_DPR = 1.5;
const BASE_OPACITY_MIN = 0.04;
const BASE_OPACITY_MAX = 0.1;
const DRIFT_SPEED = 0.012;
const SWAY_SPEED = 0.35;
const SWAY_AMPLITUDE = 6;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function makeParticleTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(180,190,205,0.9)');
  gradient.addColorStop(0.5, 'rgba(150,160,178,0.35)');
  gradient.addColorStop(1, 'rgba(150,160,178,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// SPEC: fixed full-viewport canvas, above scene layers, below text overlays
// (z sits between the scene images at z-0 and the section content at z-10).
// Density/opacity is driven externally via `setIntensity` (imperative ref),
// called from Experience's master ScrollTrigger with the same value that
// flares FogOverlay at scene boundaries, so both fog systems breathe together.
// Falls back to a couple of blurred CSS fog divs (drifting via CSS animation)
// when WebGL isn't available — `setIntensity` is a no-op there since the CSS
// fallback has no per-frame hook, just a constant ambient drift.
const FogParticles = forwardRef(function FogParticles(_props, ref) {
  const mountRef = useRef(null);
  const intensityRef = useRef(0);
  const [webglOk] = useState(supportsWebGL);

  useImperativeHandle(ref, () => ({
    setIntensity(value) {
      intensityRef.current = value;
    },
  }));

  useEffect(() => {
    if (!webglOk) return undefined;
    const mount = mountRef.current;
    if (!mount) return undefined;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const particleCount = isMobile ? Math.round(BASE_PARTICLE_COUNT / 2) : BASE_PARTICLE_COUNT;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const texture = makeParticleTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = Array.from({ length: particleCount }, () => {
      const sprite = new THREE.Sprite(material);
      const scale = 0.08 + Math.random() * 0.16;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(Math.random(), Math.random(), 0);
      scene.add(sprite);
      return {
        sprite,
        speed: DRIFT_SPEED * (0.5 + Math.random()),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: SWAY_SPEED * (0.6 + Math.random() * 0.8),
        baseOpacity: BASE_OPACITY_MIN + Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN),
      };
    });

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.right = 1;
      camera.top = h / w;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    let rafId = null;
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const boost = 1 + intensityRef.current * 1.8;

      particles.forEach((p) => {
        // Drift/sway is the part reduced-motion cares about; the fog still
        // needs to breathe with scroll (opacity boost during fog-wipe
        // transitions) even with motion reduced, so that keeps updating —
        // it's a brightness change, not movement.
        if (!reduceMotion) {
          p.sprite.position.x += p.speed * dt;
          if (p.sprite.position.x > 1.1) p.sprite.position.x = -0.1;
          p.swayPhase += p.swaySpeed * dt;
          p.sprite.position.y += Math.sin(p.swayPhase) * SWAY_AMPLITUDE * dt * 0.001;
        }
        p.sprite.material.opacity = Math.min(1, p.baseOpacity * boost);
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [webglOk]);

  if (!webglOk) {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[6] overflow-hidden">
        <div className="fog-fallback-drift absolute -left-1/4 top-1/3 h-64 w-[140%] rounded-full bg-[#96a0b2] opacity-[0.07] blur-3xl" />
        <div className="fog-fallback-drift-reverse absolute -left-1/3 top-2/3 h-72 w-[150%] rounded-full bg-[#8a94a8] opacity-[0.06] blur-3xl" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
    />
  );
});

export default FogParticles;
