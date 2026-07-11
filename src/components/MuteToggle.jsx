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
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold-dim text-gold transition hover:border-gold hover:text-gold"
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
