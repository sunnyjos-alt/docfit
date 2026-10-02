/* DocFit Service Worker — offline caching */
const CACHE_NAME = "docfit-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/mobile-app.css",
  "/mobile-polish.css",
  "/app.js",
  "/mobile-polish.js",
  "/docfit-logo.svg",
  "/docfit-mark.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// Install — pre-cache the shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first, fall back to cache
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Only handle same-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback for navigation requests
          if (event.request.mode === "navigate") return caches.match("/");
          return new Response("Offline", { status: 503 });
        })
      )
  );
});