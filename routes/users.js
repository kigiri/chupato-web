var express = require('express');
var router = express.Router();
var db = require('../modules/database.js');
var data = require('../data/locales.js');
var cache = db.getCache();

router.post('/login', function (req, res) {
  if (!req.body.pass || !req.body.account) { res.send("error"); }
  else {
    var now = new Date(Date.now()).getTime();
    req.session.tryCount++;
    if (req.session.tryCount < 4) { req.session.lastTryTimeout = now + 60000; }
    else {
      var timeLeft = req.session.lastTryTimeout - now;
      if (timeLeft > 1) {
        req.session.tryCount = 1;
        req.session.lastTryTimeout = now + 60000;
      }
    }
    res.send(db.getAuth().login(req.session, req.body.account.toUpperCase(), req.body.pass));
  }
});

router.post('/register', function (req, res) {
  var mail = req.body.mail;
  var pass = req.body.pass;
  var username = req.body.account;
  if (!mail || !pass || !username) { res.end("error"); }
  else { console.log("values OK..."); res.end(db.getAuth().register(req.session, username.toUpperCase(), pass, mail)); }
});

router.post('/logout', function (req, res) {
  cache.defaultSession(req.session);
  res.send("ok");
});

module.exports = router;
