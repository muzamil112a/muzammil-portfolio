// Global mute control (spec: "fixed bottom-right, persist in a JS variable
// only"). Extracted from Loading.jsx so the audio-engine chrome isn't coupled
// to the entry-gate component's lifecycle — it just renders once `audio` is
// ready (i.e. after ENTER/enter-silently has been clicked).
export default function MuteToggle({ audio }) {
  if (!audio.ready) return null;

  return (
    <button
      type="button"
      onClick={audio.toggleMute}
      aria-label={audio.muted ? 'Unmute' : 'Mute'}
      // `after:` is an invisible hit-slop expansion (40px visible circle ->
      // 44px actual tap target, Apple/Google's usual minimum) rather than
      // sizing the circle itself up — keeps the visual footprint exactly as
      // designed. `right`/`bottom` add env(safe-area-inset-*) on top of the
      // usual 1.5rem offset so this doesn't sit under a home-indicator/
      // rounded-corner cutout on notched phones; env() is 0 elsewhere.
      className="fixed z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold-dim text-gold transition after:absolute after:-inset-0.5 after:content-[''] hover:border-gold hover:text-gold"
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        right: 'calc(1.5rem + env(safe-area-inset-right))',
      }}
    >
      {audio.muted ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9v6h4l5 5V4L7 9H3z" />
          <path d="M17 9l4 6M21 9l-4 6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9v6h4l5 5V4L7 9H3z" />
          <path d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13" />
        </svg>
      )}
    </button>
  );
}
