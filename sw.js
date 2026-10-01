/* Service worker: guarda la app para abrirla rápido y sin conexión.
   Cambia VERSION cada vez que publiques cambios en index.html. */
const VERSION = 'acergal-mc-v4';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'icons/logo-mark.png', 'icons/logo-acergal.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // las llamadas a la API (POST) nunca se guardan
  const url = new URL(req.url);
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')
      || url.hostname === 'accounts.google.com') return;      // API e inicio de sesión: siempre en vivo
  if (req.mode === 'navigate') {                          // la app: primero red, si falla la copia guardada
    e.respondWith(fetch(req).then(r => { caches.open(VERSION).then(c => c.put('index.html', r.clone())); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {   // íconos y fuentes: copia guardada
    if (r.ok && (url.origin === location.origin || url.hostname.includes('fonts.'))) {
      const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia));
    }
    return r;
  })));
});
