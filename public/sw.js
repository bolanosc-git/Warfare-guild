const cacheName = "warfare-field-guide-v8";
const shell = [
  "/", "/index.html", "/site.css", "/app.js", "/planning.js", "/progress-catalog.js",
  "/dungeon-quests.js", "/sim-reports.js", "/offline.js", "/ui.js", "/demo.js",
  "/manifest.webmanifest", "/assets/mark.svg", "/assets/stronghold.webp", "/assets/field-atlas.webp",
  "/assets/fonts/dm-sans.woff2", "/assets/fonts/barlow-condensed-bold.woff2"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("warfare-") && key !== cacheName).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return await cache.match(request) ?? Response.json({ error: "Offline. Connect to the internet to load this guild data." }, { status: 503 });
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && url.pathname.startsWith("/assets/")) await cache.put(request, response.clone());
      return response;
    } catch {
      if (request.mode === "navigate") return await cache.match("/index.html") ?? Response.error();
      return Response.error();
    }
  })());
});
