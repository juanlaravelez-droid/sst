const CACHE_NAME = "sg-sst-shell-v16";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/variables.css",
  "./css/styles.css?v=12",
  "./js/app.js",
  "./js/application/heightWorkPermitService.js",
  "./js/db.js",
  "./js/domain/heightWorkPermit.js",
  "./js/gtc45-engine.js",
  "./js/modules/ipevr.js",
  "./js/modules/res0312.js",
  "./js/modules/inspections.js",
  "./js/modules/heightWorkPermits.js",
  "./js/utils/canvasSignature.js",
  "./js/utils/imageCompression.js",
  "./assets/icon.svg",
  "./assets/saena-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("sg-sst-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        throw new Error("El recurso no está disponible offline.");
      });
    })
  );
});
