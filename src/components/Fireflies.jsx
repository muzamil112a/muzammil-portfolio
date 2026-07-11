const FIREFLY_COUNT = 22;

// Deterministic scatter (golden-angle spacing keeps it visually random
// without clumping) computed once at module load, not regenerated per
// render — same reasoning as Loading.jsx's EMBERS constant.
function makeFireflies(count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const seed = i * 137.51;
    list.push({
      left: `${(seed % 100).toFixed(1)}%`,
      top: `${((seed * 1.7) % 100).toFixed(1)}%`,
      size: 2 + (i % 4),
      driftDuration: `${14 + (i % 7) * 2}s`,
      driftDelay: `${(i % 9) * -1.6}s`,
      twinkleDuration: `${2.4 + (i % 5) * 0.6}s`,
      twinkleDelay: `${(i % 6) * -0.7}s`,
    });
  }
  return list;
}

const FIREFLIES = makeFireflies(FIREFLY_COUNT);

// Ambient background for Contact.jsx: soft glowing dots that drift and
// twinkle independently (two separate CSS animations per dot — drift moves
// position, twinkle pulses opacity — so they can run on different, unsynced
// periods without fighting on the same property). Purely decorative;
// .firefly's base animation-name/timing/iteration-count comes from index.css,
// only duration/delay are randomized per-instance here via inline style.
export default function Fireflies() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            animationDuration: `${f.driftDuration}, ${f.twinkleDuration}`,
            animationDelay: `${f.driftDelay}, ${f.twinkleDelay}`,
          }}
        />
      ))}
    </div>
  );
}
