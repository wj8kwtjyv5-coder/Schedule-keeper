const CACHE = "sk-v6";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Network-first for API calls, cache-first for assets
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request).catch(() => new Response("{}", { headers: { "Content-Type": "application/json" } })));
    return;
  }
  // Network-first for the app page so updates arrive without a cache bump; cached copy when offline
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put("/index.html", clone)); }
        return res;
      }).catch(() => caches.match("/index.html").then(r => r || caches.match("/")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
    )
  );
});

// Push notification relay — app posts { type:"SHOW_NOTIFICATION", title, body, tag }
self.addEventListener("message", e => {
  if (e.data?.type === "SHOW_NOTIFICATION") {
    e.waitUntil(
      self.registration.showNotification(e.data.title, {
        body:   e.data.body  || "",
        icon:   "/icons/icon-192.png",
        badge:  "/icons/icon-192.png",
        tag:    e.data.tag   || "sk-notif",
        silent: false,
        data:   e.data.data  || {},
      })
    );
  }
});
