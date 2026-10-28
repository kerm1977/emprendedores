/* sw.js - Offline-first: network-first con fallback a caché.
   En desarrollo siempre se ven los cambios (red primero);
   sin conexión responde desde la caché. */

var CACHE_NAME = 'emprende-v4';

var SHELL = [
    './',
    './index.html',
    './manifest.json',
    './parciales/login.html',
    './parciales/perfil.html',
    './parciales/emprendimiento.html',
    './css/app.css',
    './css/componentes.css',
    './css/extras.css',
    './css/categorias.css',
    './css/responsive.css',
    './css/buscador.css',
    './css/perfil.css',
    './css/emprendimiento.css',
    './css/mapas.css',
    './css/login.css',
    './css/tema.css',
    './css/nav.css',
    './js/00-categorias.js',
    './js/00-categorias-ui.js',
    './js/01-estado.js',
    './js/02-datos.js',
    './js/03-ui.js',
    './js/04-nav.js',
    './js/05-render.js',
    './js/06-tema.js',
    './js/07-auth.js',
    './js/08-usuarios.js',
    './js/09-emergencia.js',
    './js/10-buscador.js',
    './js/11-buscador-ui.js',
    './js/12-perfil.js',
    './js/13-emprendimientos.js',
    './js/14-contacto.js',
    './js/15-tarjeta.js',
    './js/16-mapas.js',
    './js/17-registro-wizard.js',
    './js/18-qr.js',
    './js/99-init.js',
    './vendor/css/bootstrap.min.css',
    './vendor/css/all.min.css',
    './vendor/js/bootstrap.bundle.min.js',
    './vendor/js/qrious.min.js',
    './vendor/leaflet/leaflet.js',
    './vendor/leaflet/leaflet.css',
    './vendor/leaflet/images/marker-icon.png',
    './vendor/leaflet/images/marker-icon-2x.png',
    './vendor/leaflet/images/marker-shadow.png',
    './vendor/leaflet/images/layers.png',
    './vendor/leaflet/images/layers-2x.png',
    './vendor/js/localforage.min.js',
    './vendor/js/bcrypt.min.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './img/logo-emprendedores.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (c) { return c.addAll(SHELL); })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) {
                if (k !== CACHE_NAME) return caches.delete(k);
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;
    if (e.request.url.indexOf('/api/') !== -1) return;

    e.respondWith(
        fetch(e.request).then(function (res) {
            var copia = res.clone();
            caches.open(CACHE_NAME).then(function (c) {
                c.put(e.request, copia);
            });
            return res;
        }).catch(function () {
            return caches.match(e.request);
        })
    );
});
