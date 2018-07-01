'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

const staticOptions = {
    maxAge: 0
};

// viewed at http://localhost:8080
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/home.html'));
});
app.get('/style.css', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/style.css'));
});

app.get('/controller.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/controller.js'));
});

app.get('/idb.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/idb/lib/idb.js'));
});

app.use('/sw.js', (req, res) => res.sendFile(path.resolve(path.join(__dirname + '/dist/sw/sw.js')), staticOptions));
/*app.get('/sw.js', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/sw/sw.js'));
});*/

app.get('/skeleton', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/home.html'));
});
//let io = require('socket.io')(http);

//app.listen(3000);

io.on('connection', function (socket) {
    socket.emit('message', { message: 'welcome to the chat' });
    socket.on('send', function (data) {
        io.emit('message', data);
    });
});

http.listen(8008, function () {
    console.log('listening on *:8008');
});