var express = require('express');
var router = express.Router();
var db = require('../database.js');
var data = require('../data/locales.js');
var cache = db.getCache();

function defaultSession(session) {
  if (!session.lang)
    session.lang = 'en';
  if (!session.lastTryTimeout)
    session.lastTryTimeout = false;
  if (!session.tryCount)
    session.tryCount = 0;
  session.state = 'off';
  session.username = '';
}

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
        defaultSession(req.session);
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

router.post('/en/link', function (req, res) {
  var posted = req.body;
  var name;
  var adr;
  var common = (posted.name2 == '');
  if (common) {
    adr = posted.adr;
    name = posted.name;
  }
  else {
    if (posted.adr2 != '')
      adr = [ posted.adr, posted.adr2 ];
    else
      adr = [ posted.adr, posted.adr ];
    name = [ posted.name, posted.name2 ];
  }
  cache.addLink(name, adr, posted.icon, common);
  res.redirect('/#/chupastaff');
});

module.exports = router;
