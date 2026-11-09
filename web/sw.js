const CACHE = "per-__VERSION__";
const PRECACHE = "__PRECACHE__";
const CDN = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("per-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== location.origin && !CDN.includes(url.hostname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = e.request.mode === "navigate" ? "./" : e.request;
    const hit = await c.match(key);
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok || res.type === "opaque") c.put(e.request, res.clone());
    return res;
  }));
});
