/*var r = FetchEvent.prototype.respondWith;
FetchEvent.prototype.respondWith = function () {
  return new URL(this.request.url).search.endsWith("bypass-sw") ? void 0 : r.apply(this, arguments);
}; */

var staticCacheName = 'converter-static-files';
var allCaches = [staticCacheName];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    return cache.addAll(['index.html', 'css/style.css', 'js/controller.js', 'idb/lib/idb.js']);
  }));
}); 

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith('converter-') && !allCaches.includes(cacheName);
    }).map(function (cacheName) {
      return caches.delete(cacheName);
    }));
  }));
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('index.html'));
      return;
    }
    if (requestUrl.pathname === 'css/style.css') {
      event.respondWith(caches.match('css/style.css'));
      return;
    }
    if (requestUrl.pathname === 'idb/lib/idb.js') {
      event.respondWith(caches.match('idb/lib/idb.js'));
      return;
    }
    if (requestUrl.pathname === 'js/controller.js') {
      event.respondWith(caches.match('js/controller.js'));
      return;
    }
    /*if (requestUrl.pathname.startsWith('/style.css')) {
      event.respondWith(caches.match('/style.css'));
      return;
    }*/
    // TODO: respond to avatar urls by responding with
    // the return value of serveAvatar(event.request)
  }

  event.respondWith(caches.match(event.request).then(function (response) {
    return response || fetch(event.request);
  }));
});



self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    console.log(event);
  }
});