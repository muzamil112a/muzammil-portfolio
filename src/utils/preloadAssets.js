export const ASSET_LIST = [
  { key: 'hero-walk', url: '/assets/video/hero-walk.mp4', kind: 'video' },
  { key: 'scene-2', url: '/assets/images/scene-2.webp', kind: 'image' },
  { key: 'scene-3', url: '/assets/images/scene-3.webp', kind: 'image' },
  { key: 'scene-4-hub', url: '/assets/images/scene-4-hub.webp', kind: 'image' },
  { key: 'scene-5-terminal', url: '/assets/images/scene-5-terminal.webp', kind: 'image' },
  { key: 'rain-loop', url: '/assets/audio/rain-loop.mp3', kind: 'audio' },
  { key: 'drone-loop', url: '/assets/audio/drone-loop.mp3', kind: 'audio' },
  { key: 'gate-creak', url: '/assets/audio/gate-creak.mp3', kind: 'audio' },
  { key: 'narration-1', url: '/assets/audio/narration-1.mp3', kind: 'audio' },
  { key: 'narration-2', url: '/assets/audio/narration-2.mp3', kind: 'audio' },
  { key: 'narration-3', url: '/assets/audio/narration-3.mp3', kind: 'audio' },
  { key: 'narration-4', url: '/assets/audio/narration-4.mp3', kind: 'audio' },
];

// Fetches every asset via XHR so progress reflects real bytes transferred.
// Audio buffers are handed to onAudioBuffer for later decoding by the audio
// engine (decoding happens after the AudioContext exists, post-gesture).
export async function preloadAssets({ onProgress, onAudioBuffer }) {
  const totals = new Array(ASSET_LIST.length).fill(0);
  const loaded = new Array(ASSET_LIST.length).fill(0);
  let knownTotalBytes = 0;
  let fallbackUnits = 0;

  const report = () => {
    const knownLoaded = loaded.reduce((a, b) => a + b, 0);
    const completedFallback = totals.reduce(
      (sum, total, i) => sum + (total === 0 && loaded[i] > 0 ? 1 : 0),
      0
    );
    const totalUnits = knownTotalBytes + fallbackUnits;
    const loadedUnits = knownLoaded + completedFallback;
    const pct = totalUnits > 0 ? loadedUnits / totalUnits : 0;
    onProgress?.(Math.min(1, pct));
  };

  await Promise.all(
    ASSET_LIST.map(
      (asset, i) =>
        new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', asset.url, true);
          xhr.responseType = 'arraybuffer';

          xhr.onprogress = (e) => {
            if (e.lengthComputable) {
              if (totals[i] === 0) {
                totals[i] = e.total;
                knownTotalBytes += e.total;
              }
              loaded[i] = e.loaded;
            } else {
              fallbackUnits = fallbackUnits || 1;
            }
            report();
          };

          const finish = () => {
            if (totals[i] === 0) {
              loaded[i] = 1;
            } else {
              loaded[i] = totals[i];
            }
            report();
            resolve();
          };

          xhr.onload = () => {
            if (asset.kind === 'audio' && xhr.status >= 200 && xhr.status < 300) {
              onAudioBuffer?.(asset.key, xhr.response);
            }
            finish();
          };
          xhr.onerror = finish;
          xhr.send();
        })
    )
  );

  onProgress?.(1);
}
