const CACHE_NAME = "quickbg-shell-v2";
const SHELL_URLS = ["/", "/offline", "/manifest.json", "/favicon-32x32.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only ever touch same-origin requests. Anything cross-origin (worker API,
  // CDNs, etc.) is left entirely to the browser.
  if (url.origin !== self.location.origin) return;

  // Navigations are network-first, falling back to the offline shell when the
  // network is unavailable.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // For everything else, only serve from cache when the request maps to a
  // precached shell asset. We never write new entries at runtime, so dynamic
  // responses (API data, hashed chunks, etc.) can't be accidentally cached and
  // go straight to the network — Next.js already sets proper Cache-Control on
  // its static assets.
  if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
