// Service worker: guarda la app para abrirla sin conexión (bus, avión).
// Los datos y Claude (supabase.co) nunca se guardan aquí: siempre van a la red y la app usa su copia local.
const VERSION = "__VERSION__";
const CACHE = "vp-shell-" + VERSION;
const FONTS = "vp-fonts";
const SHELL = ["./", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("vp-shell-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") return e.respondWith(staleWhileRevalidate(req, FONTS));
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate") return e.respondWith(page(req));
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});

// La página: primero la red (para recibir actualizaciones); si tarda o no hay conexión, la copia guardada
async function page(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error("lenta")), 4000))]);
    if (res.ok) cache.put("./", res.clone());
    return res;
  } catch {
    return (await cache.match("./")) || (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name), hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}
