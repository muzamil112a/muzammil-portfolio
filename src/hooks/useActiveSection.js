import { useEffect, useState } from 'react';

// Single source of truth for "which of the 5 nav sections (I-V: hero, about,
// projects, hub, contact) is currently active" — shared by every nav UI
// (RomanNav, DiamondNav) so two independently-computed indicators can never
// disagree with each other or lag out of sync.
//
// Hero/About/Projects/Hub (0-3) come from Experience.jsx's own scroll-
// progress math, passed in as `experienceIndex` — they're crossfading
// layers inside one sticky canvas, all technically "in the viewport" at
// once, so an IntersectionObserver can't tell them apart; Experience already
// computes which one is actually on top for its own crossfade math, so this
// hook just adopts that value. Contact (4) is a real, separate document-flow
// section that genuinely enters/exits the viewport, so it's handled here
// directly with a plain IntersectionObserver, overriding whatever
// `experienceIndex` last said until the visitor scrolls back up out of it.
//
// threshold 0.15 (not 0.5): SPEC calls for the diamond/RomanNav indicators
// to track scroll "without any delay or mismatch" — waiting for Contact to
// be half-visible before flipping the indicator reads as a lag once the
// intro auto-scroll is continuous through this boundary, so this fires as
// soon as Contact is barely into view instead.
export default function useActiveSection(experienceIndex) {
  const [active, setActive] = useState(experienceIndex);

  useEffect(() => {
    setActive(experienceIndex);
  }, [experienceIndex]);

  useEffect(() => {
    const el = document.getElementById('contact');
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(4);
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return active;
}
