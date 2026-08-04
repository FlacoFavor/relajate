const CACHE_NAME = 'calma-app-v1';
const ASSETS = [
  './',
  './index.html',
  './estilos.css',
  './app.js',
  './manifest.json',
  './icono.svg'
];

// Evento de instalación: Guarda todos los archivos separados en la caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Evento de activación: Limpia cachés obsoletas de la app
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento fetch: Sirve los recursos desde la caché si falla la red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
