var socket = require('socket.io');
var db = require('./database.js');
var cache = db.getCache();

// setTimeout(function() { console.log(cache.getGameLogs()[0]) }, 1000);

function getTime() { return ~~(Date.now()/1000); }

module.exports = function (server) {
  var io = socket.listen(server);
  var onlines = {};
  var total = 0;
  var timeLight = 0;
  var timeFull = 0;

  function handleNewLogs(data) { io.sockets.emit('newLogs', data); }
  function refreshLight(data) { io.sockets.emit('refreshLight', data); }
  function refreshFull(data) { io.sockets.emit('refreshFull', data); }

  //Timed Update to check the database
  setInterval(cache.updateGameLogs, 1500, handleNewLogs);
  setInterval(cache.updateGameLogs, 1500, handleNewLogs);

  io.sockets.on('connection', function (client) {
    var logout = function () {
      var username = client.username;
      if (onlines[username]) {
        onlines[username].count--;
        if (onlines[username].count <= 0) {
          delete onlines[username];
          total--;
          console.log("out:", username);
        }
      }
      client.broadcast.emit('leaved', { 'username': username, 'total': total });
    }


    client.on('answer', function (data) { });

    client.on('join', function (username) {
      if (username) {
        client.username = username;
        if (!onlines[username]) {
          onlines[username] = {'count':1};
          total++;
          console.log("in:", username);
          console.log("current users:", onlines);
        }
        else { onlines[username].count++; }
        client.emit('login', { 'total': total });
        client.broadcast.emit('joined', { 'username': username,'total': total });
      }
    });

    client.on('sendMsg', function (msg) {
      console.log("["+msg.name+"]: "+msg.content);
      client.broadcast.emit('broadcastMsg', msg);
    });

    client.on('logout', logout);
    client.on('disconnect', logout);
  });
  return io;
};
