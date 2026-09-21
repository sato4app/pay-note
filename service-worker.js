const CACHE_NAME = 'paynote-v5';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './js/app.js',
  './js/store.js',
  './js/ui.js',
  './js/screen-record.js',
  './js/screen-history.js',
  './js/screen-settings.js',
  './js/site.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // 更新チェック用の要求(_nc付き)はキャッシュを介さずネットワークへ通す
  if (new URL(event.request.url).searchParams.has('_nc')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
