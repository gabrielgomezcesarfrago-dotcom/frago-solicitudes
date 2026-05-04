// Frago PWA Service Worker
const CACHE_NAME = "frago-v1";
const ASSETS = [
  "/frago-solicitudes/",
  "/frago-solicitudes/index.html",
  "/frago-solicitudes/manifest.json",
  "/frago-solicitudes/icon-192x192.png",
  "/frago-solicitudes/icon-512x512.png"
];

// Instalar y cachear recursos estáticos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: Network First para el formulario, Cache First para assets
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Apps Script — siempre red (no cachear datos)
  if (url.hostname.includes("script.google.com")) return;

  // Fonts — cache first
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // HTML y assets — Network first, fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
