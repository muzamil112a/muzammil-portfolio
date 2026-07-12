import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SectionNumeral from '../components/SectionNumeral.jsx';
import Fireflies from '../components/Fireflies.jsx';
import Flourish from '../components/Flourish.jsx';
import ScrambleText from '../components/ScrambleText.jsx';

const CONTACT_EMAIL = 'muzamilqaiser2001@gmail.com';

// Spawns a gold radial ripple at the pointer position on press, on whatever
// `.ornate-btn` fired the event. Plain DOM (append + self-remove via
// animationend) rather than React state — a button held/tapped rapidly can
// stack several overlapping ripples without them fighting over one boolean,
// and nothing here needs to survive a re-render or be queried afterward.
function spawnRipple(e) {
  const host = e.currentTarget;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = host.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const originX = (e.clientX ?? rect.left + rect.width / 2) - rect.left;
  const originY = (e.clientY ?? rect.top + rect.height / 2) - rect.top;

  const ripple = document.createElement('span');
  ripple.className = 'ripple-dot';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${originX - size / 2}px`;
  ripple.style.top = `${originY - size / 2}px`;
  ripple.addEventListener('animationend', () => ripple.remove());
  host.appendChild(ripple);
}

// Underline-style field (transparent, no box) to match the site's engraved/
// gothic language rather than a filled modern input — the static border is
// deliberately faint now that the animated gold underline (a sibling span,
// see Field below) is what actually signals focus, drawing in left-to-right
// instead of just swapping color.
const FIELD_CLASS =
  'relative z-10 mt-2 block w-full border-b border-gold-faint/40 bg-transparent px-1 py-2 font-serif text-base text-white/90 outline-none transition-colors duration-300 placeholder:text-white/25';

function Field({ label, as, ...rest }) {
  return (
    <label className="group relative block text-left">
      <span className="font-serif text-[11px] uppercase tracking-[0.35em] text-gold-dim/80 transition-colors duration-300 group-focus-within:text-gold">
        {label}
      </span>
      {as === 'textarea' ? (
        <textarea {...rest} className={`${FIELD_CLASS} resize-none`} />
      ) : (
        <input {...rest} className={FIELD_CLASS} />
      )}
      {/* Draws in from the left on focus rather than a flat color swap —
          same "line reveal" language as Projects' section-header rule. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold via-gold-dim to-transparent transition-transform duration-500 ease-out group-focus-within:scale-x-100"
      />
    </label>
  );
}

// Standalone Contact section — plain document-flow section (same pattern as
// Terminal.jsx below it), not one of Experience's crossfading canvas layers.
// The Hub tablet / navbar CONTACT links scroll here instead of opening the
// old overlay modal, so contact info lives in one place on the page.
//
// No form backend exists (see BUILD_SPEC.md) so submission stays fully
// static: it opens the visitor's own mail client pre-filled via a mailto:
// link rather than posting anywhere, which needs no third-party service or
// API key. `sent` just gives a brief on-screen acknowledgment; the form
// stays filled in case the mail client didn't open (webmail-only setups,
// etc.) so nothing the visitor typed is lost.
export default function Contact({ audio }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [headingVisible, setHeadingVisible] = useState(false);

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const taglineRef = useRef(null);
  const formRef = useRef(null);
  const cvButtonRef = useRef(null);
  const infoRef = useRef(null);

  // One-shot reveal the first time the section is ~25% visible — same
  // IntersectionObserver + "don't re-fire" pattern as Terminal.jsx's boot
  // sequence, just a plain stagger fade instead of a typewriter.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let played = false;
    const targets = [headingRef.current, taglineRef.current, formRef.current, cvButtonRef.current, infoRef.current].filter(
      Boolean
    );
    gsap.set(targets, { opacity: 0, y: 24 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !played) {
            played = true;
            observer.disconnect();
            gsap.to(targets, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.12 });
            setHeadingVisible(true);
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Independent of the reduced-motion-gated reveal effect above (audio isn't
  // a motion concern) — the ambient tension bed's Hub-arrival boost and
  // scroll-velocity intensity are both driven solely by Experience.jsx's
  // ScrollTrigger, which stops updating once the visitor scrolls past its
  // canvas into this section, so they'd otherwise stay frozen at whatever
  // they were the moment the visitor left Hub (usually "fast scroll, Hub
  // boosted"). Resetting them here lets the ambience settle to its calm
  // baseline through Contact instead of staying artificially loud all the
  // way to the footer, where Terminal's own fade (see
  // useAudioManager.js's applyModulation) takes it the rest of the way to
  // silence.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    let settled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !settled) {
            settled = true;
            observer.disconnect();
            audio?.setHubActive(false);
            audio?.setScrollIntensity(0);
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio inquiry from ${name || 'a visitor'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ''}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden bg-black px-6 py-28 text-center sm:px-8"
    >
      <SectionNumeral numeral="V" side="right" observe />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,130,145,0.1)_0%,rgba(5,7,10,0)_60%)]" />
      <Fireflies />

      <div ref={headingRef} className="relative flex flex-col items-center gap-5">
        <Flourish />
        <h2 className="gold-shimmer-text font-display text-2xl tracking-[0.4em] sm:text-3xl">
          <ScrambleText text="CONTACT" start={headingVisible} />
        </h2>
        <Flourish />
      </div>

      <p ref={taglineRef} className="relative max-w-md font-serif text-sm italic text-white/50">
        The fog brought you this far. Reach out, and the rest of the way is easy.
      </p>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="ornate-panel contact-form-panel relative flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-sm border border-gold-faint bg-black/40 p-7 text-left backdrop-blur-md sm:p-9"
      >
        <span aria-hidden="true" className="ornate-corner ornate-corner-tl" />
        <span aria-hidden="true" className="ornate-corner ornate-corner-tr" />
        <span aria-hidden="true" className="ornate-corner ornate-corner-bl" />
        <span aria-hidden="true" className="ornate-corner ornate-corner-br" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-dim to-transparent opacity-70"
        />
        <Field
          label="Name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
        />
        <Field
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Field
          as="textarea"
          label="Message"
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you building?"
          required
        />

        <button
          type="submit"
          onMouseDown={spawnRipple}
          className="ornate-btn group relative mt-2 self-center overflow-hidden rounded-full px-10 py-3 font-display text-xs tracking-[0.4em] text-gold"
        >
          <span aria-hidden="true" className="ornate-sheen rounded-full" />
          <span className="relative z-10">SEND A MESSAGE</span>
        </button>

        {sent && (
          <p className="fade-up-in flex items-center justify-center gap-2 text-center font-serif text-xs italic tracking-wide text-gold-dim">
            <span aria-hidden="true" className="text-gold">
              ✦
            </span>
            Opening your mail client — thank you for reaching out.
          </p>
        )}
      </form>

      <a
        ref={cvButtonRef}
        href="/muzammil-cv.pdf"
        download="Muhammad-Muzammil-CV.pdf"
        onMouseDown={spawnRipple}
        className="ornate-btn group relative overflow-hidden rounded-sm px-8 py-2.5 font-display text-xs tracking-[0.35em] text-gold"
      >
        <span aria-hidden="true" className="ornate-corner ornate-corner-tl" />
        <span aria-hidden="true" className="ornate-corner ornate-corner-tr" />
        <span aria-hidden="true" className="ornate-corner ornate-corner-bl" />
        <span aria-hidden="true" className="ornate-corner ornate-corner-br" />
        <span aria-hidden="true" className="ornate-sheen rounded-sm" />
        <span className="relative z-10">DOWNLOAD CV</span>
      </a>

      <div ref={infoRef} className="relative flex flex-col items-center gap-3 font-serif text-sm text-white/50">
        <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-gold">
          {CONTACT_EMAIL}
        </a>
        <a
          href="https://linkedin.com/in/muhammad-muzamil-b421b023b"
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-gold"
        >
          linkedin.com/in/muhammad-muzamil-b421b023b
        </a>
        <span className="text-xs tracking-[0.2em] text-gold-dim">LAHORE, PAKISTAN</span>
      </div>
    </section>
  );
}
