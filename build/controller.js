
//import idb from 'idb';
//const request = require('request');
//const idb = require('idb');

function openDatabase() { //dd
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) () => {
    return Promise.resolve();
  }
//
  return idb.open('currency', 1, function(upgradeDb) {
    let store = upgradeDb.createObjectStore('converter', {
      keyPath: 'id'
    });
    store.createIndex('by-name', 'currencyName');
  });
}

 function Controller()  {
  this._lostConnectionToast = null;
  this._dbPromise = openDatabase();
  this._registerServiceWorker();
  //this._cleanImageCache();

  var Controller = this;


  /*this._showCachedMessages().then(function() {
    Controller._openSocket();
  });*/
}

Controller.prototype._registerServiceWorker = () => {
  if (!navigator.serviceWorker) () => { return };

  var Controller = this;

  navigator.serviceWorker.register('/sw.js').then( (reg) => {
    if (!navigator.serviceWorker.controller) () =>  {
      return;
    }

    if (reg.waiting) {
      Controller._updateReady(reg.waiting);
      return;
    }

    if (reg.installing) () => {
      Controller._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', () => {
      Controller._trackInstalling(reg.installing);
    });
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
    if (!db) return;

    var index = db.transaction('converter')
      .objectStore('converter').index('by-name');

    return index.getAll().then(function(messages) {
      console.log('converter table created');;
    });
  });
};

Controller.prototype._trackInstalling = (worker) => {
  var Controller = this;
  worker.addEventListener('statechange', () => {
    if (worker.state == 'installed') {
      Controller._updateReady(worker);
    }
  });
};

Controller.prototype._updateReady = function(worker) {
  /*var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });*/

 // toast.answer.then(function(answer) {
   // if (answer != 'refresh') return;
    worker.postMessage({action: 'skipWaiting'});
  //});
};

// open a connection to the server for live updates
Controller.prototype._openSocket = function() {
  

    // try and reconnect in 5 seconds
    setTimeout( () => {
      Controller._openSocket();
    }, 5000);
 
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
