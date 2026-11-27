/* Haushaltsbuch · Offline-Speicher mit Update-Weg.
   Eigene Dateien (App, Icons): Netz zuerst, damit Verbesserungen beim
   Neuladen ankommen; ohne Internet greift der Speicher.
   Leseprogramm (Tesseract): Speicher zuerst, damit es nach dem ersten
   Quittung-Lesen auch offline geht. */
var APP_SPEICHER = 'haushaltsbuch-app-version-27-11-2026-foto-oben-update-suche';
var OCR_SPEICHER = 'haushaltsbuch-ocr-v1';
var OCR_QUELLEN = ['cdn.jsdelivr.net', 'tessdata.projectnaptha.com', 'unpkg.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(APP_SPEICHER).then(function (c) {
    return c.addAll(['./', 'index.html', 'manifest.json', 'VERSION.txt', 'icon-192.png', 'icon-512.png']);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (schluessel) {
    return Promise.all(schluessel.filter(function (k) {
      return k !== APP_SPEICHER && k !== OCR_SPEICHER;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  var url = new URL(e.request.url);
  var istApp = url.origin === self.location.origin;
  var istOcr = OCR_QUELLEN.indexOf(url.hostname) >= 0;
  if (!istApp && !istOcr) { return; }

  if (istApp) {
    /* Netz zuerst: Verbesserungen kommen beim Neuladen an. */
    e.respondWith(
      fetch(e.request).then(function (antwort) {
        if (antwort && antwort.ok) {
          var kopie = antwort.clone();
          caches.open(APP_SPEICHER).then(function (c) { c.put(e.request, kopie); });
        }
        return antwort;
      }).catch(function () {
        return caches.match(e.request).then(function (treffer) {
          return treffer || caches.match('index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (treffer) {
      if (treffer) { return treffer; }
      return fetch(e.request).then(function (antwort) {
        if (antwort && (antwort.ok || antwort.type === 'opaque')) {
          var kopie = antwort.clone();
          caches.open(OCR_SPEICHER).then(function (c) { c.put(e.request, kopie); });
        }
        return antwort;
      });
    })
  );
});
