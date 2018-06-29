


let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let path = require('path');
import idb from 'idb';


// viewed at http://localhost:8080
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/home.html'));
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname + '/style.css'));
});

let io = require('socket.io')(http);

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

