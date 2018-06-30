var r=FetchEvent.prototype.respondWith
FetchEvent.prototype.respondWith=function(){return new URL(this.request.url).search.endsWith("bypass-sw")?void 0:r.apply(this,arguments)}
// 
var staticCacheName = 'converter-static-files';
var allCaches = [
  staticCacheName
];
 
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
	    '/skeleton',
        '/style.css',
		'/controller.js',
		'/idb.js'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('converter-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
      return;
    }
	if (requestUrl.pathname === '/style.css') {
      event.respondWith(caches.match('/style.css'));
      return;
    }
	if (requestUrl.pathname === '/idb.js') {
      event.respondWith(caches.match('/idb.js'));
      return;
    }
	if (requestUrl.pathname === '/controller.js') {
      event.respondWith(caches.match('/controller.js'));
      return;
    }
    /*if (requestUrl.pathname.startsWith('/style.css')) {
      event.respondWith(caches.match('/style.css'));
      return;
    }*/
    // TODO: respond to avatar urls by responding with
    // the return value of serveAvatar(event.request)
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});


function servePhoto(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
   console.log(event);
  }
});