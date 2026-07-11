import { useEffect } from 'react';
import Flourish from './Flourish.jsx';

export default function OverlayModal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-panel-in relative w-full max-w-xl rounded-sm border border-gold-faint bg-gradient-to-b from-fog-800/95 to-fog-900/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold-faint text-gold-dim transition hover:border-gold hover:text-gold hover:shadow-[0_0_12px_rgba(201,162,39,0.4)]"
        >
          ✕
        </button>
        <div className="flex flex-col items-center gap-3 text-center">
          <h3 className="font-display text-xl tracking-[0.35em] text-gold">{title}</h3>
          <Flourish />
        </div>
        {/* Scroll containment: with six skill groups the content can exceed
            a short viewport — the panel stays put and only this area
            scrolls (thin gold scrollbar from index.css). */}
        <div className="mt-6 max-h-[62vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
