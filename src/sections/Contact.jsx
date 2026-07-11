import { useState } from 'react';
import SectionNumeral from '../components/SectionNumeral.jsx';
import Fireflies from '../components/Fireflies.jsx';
import Flourish from '../components/Flourish.jsx';

const CONTACT_EMAIL = 'muzamilqaiser2001@gmail.com';

// Underline-style field (transparent, no box) to match the site's engraved/
// gothic language rather than a filled modern input — border brightens gold
// on focus instead of a generic browser focus ring.
const FIELD_CLASS =
  'mt-2 block w-full border-b border-gold-faint bg-transparent px-1 py-2 font-serif text-base text-white/90 outline-none transition-colors duration-300 placeholder:text-white/25 focus:border-gold';

function Field({ label, as, ...rest }) {
  return (
    <label className="relative block text-left">
      <span className="font-serif text-[11px] uppercase tracking-[0.35em] text-gold-dim/80">{label}</span>
      {as === 'textarea' ? (
        <textarea {...rest} className={`${FIELD_CLASS} resize-none`} />
      ) : (
        <input {...rest} className={FIELD_CLASS} />
      )}
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
export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

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
      className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden bg-black px-6 py-28 text-center sm:px-8"
    >
      <SectionNumeral numeral="V" side="right" observe />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,130,145,0.1)_0%,rgba(5,7,10,0)_60%)]" />
      <Fireflies />

      <div className="relative flex flex-col items-center gap-5">
        <Flourish />
        <h2 className="font-display text-2xl tracking-[0.4em] text-gold sm:text-3xl">CONTACT</h2>
        <Flourish />
      </div>

      <p className="relative max-w-md font-serif text-sm italic text-white/50">
        The fog brought you this far. Reach out, and the rest of the way is easy.
      </p>

      <form
        onSubmit={handleSubmit}
        className="relative flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-sm border border-gold-faint bg-black/40 p-7 text-left backdrop-blur-md sm:p-9"
      >
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
          className="group relative mt-2 self-center overflow-hidden rounded-full border border-gold-dim px-10 py-3 font-display text-xs tracking-[0.4em] text-gold transition duration-300 hover:border-gold hover:shadow-[0_0_24px_rgba(201,162,39,0.35)]"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gold/10 transition-transform duration-700 ease-out group-hover:translate-x-0" />
          <span className="relative">SEND A MESSAGE</span>
        </button>

        {sent && (
          <p className="text-center font-serif text-xs italic tracking-wide text-gold-dim">
            Opening your mail client — thank you for reaching out.
          </p>
        )}
      </form>

      <a
        href="/muzammil-cv.pdf"
        download="Muhammad-Muzammil-CV.pdf"
        className="group relative overflow-hidden rounded-sm border border-gold-dim px-8 py-2.5 font-display text-xs tracking-[0.35em] text-gold transition duration-300 hover:border-gold hover:shadow-[0_0_24px_rgba(201,162,39,0.35)]"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gold/10 transition-transform duration-700 ease-out group-hover:translate-x-0" />
        <span className="relative">DOWNLOAD CV</span>
      </a>

      <div className="relative flex flex-col items-center gap-3 font-serif text-sm text-white/50">
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
