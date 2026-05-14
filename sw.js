// Frago PWA Service Worker — Network First + OneSignal integration v7
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "frago-v7";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Apps Script, Google y OneSignal — nunca cachear ni interceptar
  if (url.hostname.includes("script.google.com") ||
      url.hostname.includes("googleapis.com") ||
      url.hostname.includes("fonts.gstatic.com") ||
      url.hostname.includes("onesignal.com")) return;

  // Network First — siempre intentar red primero
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
