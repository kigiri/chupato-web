var express = require('express');
var router = express.Router();
var db = require('../database.js');
var data = require('../data/locales.js');
var cache = db.getCache();
var roles = db.getRoles();

function getTryLeft(session) {
  var now = new Date(Date.now()).getTime();
  if (session.tryCount < 4) { return (3 - session.tryCount); }
  else {
    var timeLeft = Math.floor((session.lastTryTimeout - now) / 1000);
    if (timeLeft > 1) { return (-timeLeft); }
    session.tryCount = 0;
    return (3);
  }
}

router.get(['/', '/fr/', '/fr', '/en', '/en/', '/en/undefined/fr/', '/fr/undefined/en/'], function (req, res) {
  var lang;
  switch (req.originalUrl) {
    case '/en/undefined/fr/':
    case '/fr/':
    case '/fr':
      lang = 'fr'; break;
    case '/fr/undefined/en/':
    case '/en/':
    case '/en':
      lang = 'en'; break;
    default:
      if (!req.session.state)
        cache.defaultSession(req.session);
      var username = req.session.username;
      if (cache.mustFlush(username))
        cache.updateSession(req.session);
      lang = req.session.lang;
      var i = cache.getLocaleIndex(lang);
      res.render('index', {
        "title": 'Chupato',
        "username": req.session.username,
        "onlineCount": Math.floor((Math.random()*100)+50),
        "links": cache.getLocale(i).links,
        "state": req.session.state,
        loc: { "i":i, "name": lang },
        "menu": data.menu,
        "banner": data.banner,
        "tryLeft": getTryLeft(req.session)
      }); return;
  }
  req.session.lang = lang;
  res.redirect('/#/');
});

router.post('/staff/link', function (req, res) {
  var posted = req.body;
  if ((posted.name && posted.adr) && (req.session.roles & (roles["CM"] | roles["WEB"]))) {
    var name;
    var adr;
    var common = (posted.name2) ? true : false;
    if (common) {
      adr = posted.adr;
      name = posted.name;
    }
    else {
      if (posted.adr2)
        adr = [ posted.adr, posted.adr2 ];
      else
        adr = [ posted.adr, posted.adr ];
      name = [ posted.name, posted.name2 ];
    }
    cache.addLink(name, adr, posted.icon, common);
    res.end('SUCCESS');
  }
  else
    res.send(500);
});

router.post('/staff/promote', function (req, res) {
  var form = req.body;
  var s = req.session;
  console.log("Account: ", s.username, " - roles :", s.roles, " - realm", s.realm);
  if (s.state === 'off')
    res.end('Connection has been lost, please relog.');
  else if (!form.id)
    res.end('No account id specified');
  else if (!form.realm)
    res.end('No realm specified');
  else if (isNaN(form.roles))
    res.end('No roles specified');
  else if (!(s.roles & roles["ADMIN"]))
    res.end("Your account can't promote");
  else if (s.realm != -1 && s.realm != form.realm)
    res.end("Your can't promote someone on this realm.");
  else {
    var a = cache.getAccount(form.username);
    if (!a)
      res.end("User not found.");
    else if (a.realm && a.realm != s.realm && s.realm != -1)
      res.end("You can't promote a GM from another server.");
    else {
      cache.promote(form);
      res.end('SUCCESS');
    }
  }
});

router.post('/staff/user', function (req, res) {
  console.log(req.body.username);
  if (req.session.state === 'off')
    res.end('1');
  else if (!req.body.username)
    res.end('2');
  else if (!req.session.roles)
    res.end('3');
  else {
    var a = cache.getAccount(req.body.username);
    res.json({'gmlevel':a.gmlevel, 'realm':a.realm, 'roles':a.roles, 'characters':a.characters});
  }
});

router.post('/staff/sql', function (req, res) {
  var s = req.session;
  var query = req.body.sql;
  if (s.state !== 'on')
    res.end('Connection has been lost, please relog.');
  else if (!query)
    res.end('Empty SQL Query.');
  else if (!(s.roles & roles["SQL"]))
    res.end('Your account need SQL rights to do this.');
  else {
    console.log('call with : ', query, s.realm);
    db.executeRawSQL(res, query, s.realm);
  }
});

router.post('/userdata', function (req, res) {
  var s = req.session;
  var key = req.body.key;
  var sessionKey = req.body.sessionKey;
  var value = req.body.value;
  if (!value)
    res.end('Wrong Data');
  else {
    if (sessionKey)
      req.session[sessionKey] = value;
    if (s.state === 'on') {
      if (!key)
        res.end('Wrong Data');
      else if (key === "roles")
        res.end("Your account don't have the rights to do this.");
      else {
        res.end("OK");
        cache.updateUserdata(key, value, s.userId);
      }
    } else {
      if (sessionKey)
        res.end("OK");
      else
        res.end('Wrong Data');
    }
  }
});

router.post('/api/game/levelup/:guid/:level/:hours/:min', function (req, res) {
  console.log("Get a level req! try to send msg");
  io.sockets.emit('broadcastMsg', {"name":"announce", "content": "Some player reached lvl 19 !"});
});

module.exports = router;
