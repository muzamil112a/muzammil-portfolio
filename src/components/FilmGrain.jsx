import { useEffect, useState } from 'react';

const TILE_SIZE = 96;

// Generates a small noise PNG on a canvas at mount (data URL, no network
// asset) and tiles it. `.grain-layer` (index.css) steps its background
// position via CSS animation for the flicker; this component just supplies
// the texture and the fixed/blend-mode positioning.
function makeGrainDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(TILE_SIZE, TILE_SIZE);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

export default function FilmGrain() {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    setDataUrl(makeGrainDataUrl());
  }, []);

  if (!dataUrl) return null;

  return (
    <div
      aria-hidden="true"
      className="grain-layer pointer-events-none fixed inset-0 z-[7] opacity-5"
      style={{
        backgroundImage: `url(${dataUrl})`,
        backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
