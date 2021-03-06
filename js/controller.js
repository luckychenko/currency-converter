'use strict';
//import idb from 'idb';
//const request = require('request');
//const idb = require('idb');
 


class Controller  {
	constructor () {
  this._lostConnectionToast = null;
  this._registerServiceWorker();
  this._dbPromise = this.openDatabase();
  //this._cleanImageCache();
   this.fillCurr();
  var Controller = this;


  /*this._showCachedMessages().then(function() {
    Controller._openSocket();
  });*/
}



 openDatabase() { //dd
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) () => {
    return Promise.resolve();
  }
//
  return idb.open('converter', 1, function(upgradeDb) {
    let store = upgradeDb.createObjectStore('currency', {
      keyPath: 'id'
    });
    store.createIndex('by-name', 'currencyName');
	upgradeDb.createObjectStore('exchangerate');
  });
}

   fillCurr() {
	   var Controller = this;
   Controller._idbCurr().then(function() {
    Controller._getCurrencies();
    });
   }
   
   
_registerServiceWorker () {
  if (!navigator.serviceWorker) () => { return };

  var Controller = this;

  navigator.serviceWorker.register('./sw.js').then( (reg) => {
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

_trackInstalling (worker) {
  var Controller = this;
  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      Controller._updateReady(worker);
    }
  });
};

_updateReady(worker) {
   
    worker.postMessage({action: 'skipWaiting'});

};

 _getCurrencies () {
	var Controller = this;
	
fetch('https://free.currencyconverterapi.com/api/v5/currencies')
           .then(res => res.json())
           .then( data => {
			   document.getElementById('msg').innerHTML = 'getting currencies list, please stay connected...';
              let arr = '';
               for (let key in data.results) {
                   //console.log(data.results[`${key}`]);
                  // arr += '<option value="' + data.results[`${key}`].id + '"> ' + data.results[`${key}`].currencyName;
				   Controller._idbCurrencies(data.results[`${key}`]);
               }
              // document.getElementById('from').innerHTML = arr;
              // document.getElementById('to').innerHTML = arr;
			   Controller._idbCurr();
			   document.getElementById('msg').innerHTML = '';
              }).catch(err => {
			  console.log(err);
			  document.getElementById('msg').innerHTML = 'you seem to be offline...';
			  /* setInterval( () => {
				  document.getElementById('msg').innerHTML = 'retrying...';
                 Controller._getCurrencies();
                }, 1000 * 5); */
			  }
			  );
     
}

 _idbCurrencies (key) {
	var Controller = this;
return this._dbPromise.then(function(db) {
  var tx = db.transaction('currency', 'readwrite');
  var currency = tx.objectStore('currency');
          currency.put(key);
  return tx.complete;
}).then(function() {
  console.log('Added all currency');
});

}


 _getExchange (exfrom,exto,val,out) {
	var Controller = this;
	var exvalue = "";
	
fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${exfrom}_${exto},${exto}_${exfrom}&compact=ultra`)
           .then(res => res.json())
           .then( data => {
			   document.getElementById('msg').innerHTML = 'converting please wait...';
              console.log(data);
				   Controller._idbExrate(`${exfrom}_${exto}`,data[`${exfrom}_${exto}`],`${exto}_${exfrom}`,data[`${exto}_${exfrom}`]);
               exvalue = parseFloat(parseFloat(data[`${exfrom}_${exto}`]) * parseFloat(val)).toFixed(2); 
                console.log(exvalue);	
                	document.getElementById(out).value = exvalue;
                    document.getElementById('msg').innerHTML = '';					
              }).catch(err => {
			  console.log(err);
			  Controller._idbExchange (exfrom,exto,val,out);
			  document.getElementById('msg').innerHTML = '';
			  }
			  );
    
}




 _idbExrate (id1,exfrom,id2,exto) {
	var Controller = this;
return this._dbPromise.then(function(db) {
  var tx = db.transaction('exchangerate', 'readwrite');
  var rate = tx.objectStore('exchangerate');
          rate.put(exfrom,id1);
		  rate.put(exto,id2);
  return tx.complete;
}).then(function() {
  console.log('Added exchange rate');
});

}


 _idbCurr () {
var Controller = this;

document.getElementById('from').innerHTML = ''
  document.getElementById('to').innerHTML = '';
  let arr=''
 return this._dbPromise.then(function(db) {
	 // if we're already showing currency, there's no point fetching
    // currency from IDB
    if (!db || document.getElementById('from').innerHTML !== '') return;
	
  var tx = db.transaction('currency');
  var currStore = tx.objectStore('currency');
  var currIndex = currStore.index('by-name');

  return currIndex.getAll();
}).then(function(data) {
	data.forEach(function(data) {
       arr += `<option value="${data.id}"> ${data.currencyName}</option>`;
      });	
  //console.log('currency:', data);
  return arr;
}).then( (arr) => {
			   document.getElementById('from').innerHTML = arr;
               document.getElementById('to').innerHTML = arr;
});

document.getElementById('msg').innerHTML = '';
}


 _idbExchange (exfrom,exto,val,out) {
var Controller = this;
document.getElementById('msg').innerHTML = 'converting please wait...';
  let exvalue;
 return this._dbPromise.then(function(db) {
  var tx = db.transaction('exchangerate');
  var currStore = tx.objectStore('exchangerate');
  return currStore.getAll(`${exfrom}_${exto}`);
}).then(function(data) {
       exvalue = parseFloat(parseFloat(data) * parseFloat(val)).toFixed(2); 
  	 console.log('currency:', exvalue);
    document.getElementById(out).value = exvalue;
	document.getElementById('msg').innerHTML = '';
});


}






}