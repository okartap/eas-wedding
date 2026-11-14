const CACHE = 'eas-v29';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'sync.js', 'drive.js', 'pin.js', 'google-config.js', 'firebase-config.js', 'vendor/firebase-app-compat.js', 'vendor/firebase-auth-compat.js', 'vendor/firebase-firestore-compat.js', 'manifest.webmanifest', 'vendor/jspdf.umd.min.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/logo.png', 'icons/favicon-32.png', 'icons/favicon-16.png', 'icons/favicon-48.png', 'icons/favicon.ico', 'icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return; // Google y Drive van directos, sin pasar por la app
  if (u.pathname.endsWith('/cal.ics')) { // genera un archivo de calendario a partir de la dirección (para abrirlo directamente en Calendario)
    try {
      const bin = atob((u.searchParams.get('d') || '').replace(/-/g, '+').replace(/_/g, '/'));
      const body = Uint8Array.from(bin, c => c.charCodeAt(0));
      e.respondWith(new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="ea-wedding.ics"', 'Cache-Control': 'no-store' } }));
    } catch (x) { e.respondWith(new Response('Evento no válido', { status: 400 })); }
    return;
  }
  if (u.pathname.includes('/icons/')) { // iconos y logo: primero la copia guardada (evita que se pierdan al volver de otra app)
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(m => m || fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })));
    return;
  }
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
