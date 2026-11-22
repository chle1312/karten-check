/* Karten-Check – Hintergrundskript (Service Worker)
   Hält die Oberfläche für den Offline-Start bereit. Die Seite selbst wird immer zuerst frisch
   vom Server geholt, damit Updates sofort ankommen. Anfragen an Gemini und die Kartendatenbanken
   werden nie zwischengespeichert. */
var CACHE = 'karten-check-1.35';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'qrcode.min.js', 'jsQR.min.js', 'bg.jpg', 'card-art.jpg', 'baer-1-gruen.png', 'baer-2-orange.png', 'baer-3-rot.png', 'baer-4-weiss.png', 'baer-5-gelb.png', 'baer-6-dunkelrot.png', 'eis-1.png', 'eis-2.png', 'eis-3.png', 'eis-4.png', 'eis-5.png', 'fredoka-latin-600-normal.woff2', 'fredoka-latin-700-normal.woff2', 'nunito-latin-700-normal.woff2', 'nunito-latin-800-normal.woff2', 'nunito-latin-900-normal.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) { return; }
  var isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isPage) {
    /* Netz zuerst, bei fehlender Verbindung die gespeicherte Fassung */
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
      return res;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
