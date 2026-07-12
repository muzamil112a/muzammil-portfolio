const blobUrls = new Map();

// preloadAssets.js already fetches hero-walk.mp4's bytes in full (for the
// loading-gate progress bar) before the gate ever opens — handing those same
// bytes to the <video> element as a Blob URL means the element's own load()
// resolves from memory instead of triggering a second full network fetch of
// the same 5MB file. Dispatches a window event so Experience.jsx's video
// setup (which may run before this resolves) can react either way.
export function storeVideoBlob(key, arrayBuffer, mimeType) {
  const url = URL.createObjectURL(new Blob([arrayBuffer], { type: mimeType }));
  blobUrls.set(key, url);
  window.dispatchEvent(new CustomEvent('video-blob-ready', { detail: { key } }));
}

export function getVideoBlobUrl(key) {
  return blobUrls.get(key);
}
