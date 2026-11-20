// Ajedrez Academy se ha mudado a https://ajedrez-academy.github.io/
// Este service worker sustituye al antiguo: borra su caché, se da de baja y recarga las pestañas abiertas.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (cs) { cs.forEach(function (c) { c.navigate(c.url); }); })
  );
});
