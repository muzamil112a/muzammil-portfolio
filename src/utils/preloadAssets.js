// Scene backgrounds ship in two sizes (see the `<picture>` elements in
// About/Projects/Hub/Terminal, which pick between them the same way via a
// max-width media query) — preloading the OTHER size here as well would
// silently double back the exact bandwidth savings those `<picture>`
// elements exist for, so this picks the one the browser will actually use.
const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
function sceneUrl(name) {
  return isMobileViewport ? `/assets/images/${name}-mobile.webp` : `/assets/images/${name}.webp`;
}

export const ASSET_LIST = [
  { key: 'hero-walk', url: '/assets/video/hero-walk.mp4', kind: 'video' },
  { key: 'scene-2', url: sceneUrl('scene-2'), kind: 'image' },
  { key: 'scene-3', url: sceneUrl('scene-3'), kind: 'image' },
  { key: 'scene-4-hub', url: sceneUrl('scene-4-hub'), kind: 'image' },
  { key: 'scene-5-terminal', url: sceneUrl('scene-5-terminal'), kind: 'image' },
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
// Video bytes are handed to onVideoBuffer so Hero's <video> element can play
// them straight from memory (see utils/videoCache.js) instead of the browser
// re-fetching the same file a second time over the network.
export async function preloadAssets({ onProgress, onAudioBuffer, onVideoBuffer }) {
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
            if (xhr.status >= 200 && xhr.status < 300) {
              if (asset.kind === 'audio') {
                onAudioBuffer?.(asset.key, xhr.response);
              } else if (asset.kind === 'video') {
                onVideoBuffer?.(asset.key, xhr.response, xhr.getResponseHeader('Content-Type'));
              }
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
