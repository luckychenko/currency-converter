

const idb = require('idb');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
import Controller from './controller';


function openDatabase() { //dd
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('currency', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('countries', {
      keyPath: 'id'
    });
   // store.createIndex('by-date', 'time');
  });
}

  
 


// viewed at http://localhost:8080
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/home.html'));
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname + '/style.css'));
});

//let io = require('socket.io')(http);

//app.listen(3000);

io.on('connection', function (socket) {
    socket.emit('message', { message: 'welcome to the chat' });
    socket.on('send', function (data) {
        io.emit('message', data);
    });
}); 

http.listen(8008, function(){
  console.log('listening on *:8008');
});

