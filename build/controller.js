// JavaScript Document

import idb from 'idb';
const request = require('request');



function openDatabase() { //dd
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('currency', 1, function(upgradeDb) {
    let store = upgradeDb.createObjectStore('converter', {
      keyPath: 'id'
    });
   // store.createIndex('by-date', 'time');
  });
}

export default function Controller()  {
  this._lostConnectionToast = null;
  this._dbPromise = openDatabase();
  this._registerServiceWorker();
  this._cleanImageCache();

  var Controller = this;

  setInterval(function() {
    Controller._cleanImageCache();
  }, 1000 * 60 * 5);

  this._showCachedMessages().then(function() {
    Controller._openSocket();
  });
}

Controller.prototype._registerServiceWorker = function() {
  if (!navigator.serviceWorker) return;

  var Controller = this;

  navigator.serviceWorker.register('../sw/index.js').then(function(reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }

 /*   if (reg.waiting) {
      Controller._updateReady(reg.waiting);
      return;
    }

    if (reg.installing) {
      Controller._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      Controller._trackInstalling(reg.installing);
    });*/
  });

  // Ensure refresh is only called once.
  // This works around a bug in "force update on reload".
  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
};

Controller.prototype._showCachedMessages = function() {
  var Controller = this;

  return this._dbPromise.then(function(db) {
    // if we're already showing posts, eg shift-refresh
    // or the very first load, there's no point fetching
    // posts from IDB
    if (!db || Controller._postsView.showingPosts()) return;

    var index = db.transaction('converter')
      .objectStore('converter').index('by-date');

    return index.getAll().then(function(messages) {
      Controller._postsView.addPosts(messages.reverse());
    });
  });
};

Controller.prototype._trackInstalling = function(worker) {
  var Controller = this;
  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      Controller._updateReady(worker);
    }
  });
};

Controller.prototype._updateReady = function(worker) {
  var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer.then(function(answer) {
    if (answer != 'refresh') return;
    worker.postMessage({action: 'skipWaiting'});
  });
};

// open a connection to the server for live updates
Controller.prototype._openSocket = function() {
  var Controller = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function() {
    if (Controller._lostConnectionToast) {
      Controller._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      Controller._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function() {
    // tell the user
    if (!Controller._lostConnectionToast) {
      Controller._lostConnectionToast = Controller._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      Controller._openSocket();
    }, 5000);
  });
};

Controller.prototype._cleanImageCache = function() {
  return this._dbPromise.then(function(db) {
    if (!db) return;

    var imagesNeeded = [];

    var tx = db.transaction('converter');
    return tx.objectStore('converter').getAll().then(function(messages) {
      messages.forEach(function(message) {
        if (message.photo) {
          imagesNeeded.push(message.photo);
        }
        imagesNeeded.push(message.avatar);
      });

      return caches.open('converter-content-imgs');
    }).then(function(cache) {
      return cache.keys().then(function(requests) {
        requests.forEach(function(request) {
          var url = new URL(request.url);
          if (!imagesNeeded.includes(url.pathname)) cache.delete(request);
        });
      });
    });
  });
};

// called when the web socket sends message data
Controller.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data);

  this._dbPromise.then(function(db) {
    if (!db) return;

    var tx = db.transaction('converter', 'readwrite');
    var store = tx.objectStore('converter');
    messages.forEach(function(message) {
      store.put(message);
    });

    // limit store to 30 items
    store.index('by-date').openCursor(null, "prev").then(function(cursor) {
      return cursor.advance(30);
    }).then(function deleteRest(cursor) {
      if (!cursor) return;
      cursor.delete();
      return cursor.continue().then(deleteRest);
    });
  });

  this._postsView.addPosts(messages);
};
