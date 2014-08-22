var express = require('express');
var router = express.Router();
var db = require('../database.js');
var cache = db.getCache();

router.post('/levelup/:guid/:level/:hours/:min', function (req, res) {
   console.log("personage:", req.param('guid'), "lvl", req.param('level'));
   //setTimeout(function() {res.end("OK")}, 1000);
   
  // io.sockets.emit('broadcastMsg', {"name":"announce", "content": "Some player reached lvl 19 !"});
});

router.get('/a', function (req, res) {
   console.log("Get a level req! try to send msg");
//   io.sockets.emit('broadcastMsg', {"name":"announce", "content": "Some player reached lvl 19 !"});
});


// router.post('/login', function (req, res) {
//   if (!req.body.pass || !req.body.account) { res.send("error"); }
//   else {
//     var now = new Date(Date.now()).getTime();
//     req.session.tryCount++;
//     if (req.session.tryCount < 4) { req.session.lastTryTimeout = now + 60000; }
//     else {
//       var timeLeft = req.session.lastTryTimeout - now;
//       if (timeLeft > 1) {
//         req.session.tryCount = 1;
//         req.session.lastTryTimeout = now + 60000;
//       }
//     }
//     res.send(db.getAuth().login(req.session, req.body.account.toUpperCase(), req.body.pass));
//   }
// });

// router.post('/register', function (req, res) {
//   var mail = req.body.mail;
//   var pass = req.body.pass;
//   var username = req.body.account;
//   if (!mail || !pass || !username) { res.end("error"); }
//   else { console.log("values OK..."); res.end(db.getAuth().register(req.session, username.toUpperCase(), pass, mail)); }
// });

// router.post('/logout', function (req, res) {
//   cache.defaultSession(req.session);
//   res.send("ok");
// });

module.exports = router;
