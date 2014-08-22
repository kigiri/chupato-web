var express = require('express');
var router = express.Router();
var db = require('../database.js');
var data = require('../data/locales.js');
var cache = db.getCache();
var Paymentwall = require('paymentwall');
Paymentwall.configure(
  Paymentwall.Base.API_VC,
  '2145a6621ab5a85acd0edc7dc3fba5c5',
  '6f34419dfb299b8781ba155857ff684c'
);

router.get('/home', function  (req, res) {
  res.render('templates/home', { "title": 'Home' });
});

router.get('/forum', function (req, res) {
  res.render('templates/forum', { "title": 'Forum' });
});

router.get('/pingback', function (req, res) {
  var pingback = new Paymentwall.Pingback(req.query, req._remoteAddress);
  if (pingback.validate()) {
    var virtualCurrency = pingback.getVirtualCurrencyAmount();
    if (pingback.isDeliverable()) {
      console.log(pingback);
      var a = cache.getAccount(pingback.parameters.uid);
      a.cp += pingback.parameters.currency;
      cache.updateUserdata("cp", a.cp + pingback.parameters.currency, a.username);
    } else { console.log('Withdraw :', pingback); }
    res.end('OK');
  } else { res.end(pingback.getErrorSummary()); }
});

router.get('/shop', function (req, res) {

  if (req.session.state !== "on") {
    res.render('templates/shop', { "title": 'Shop' });
  } else {
    var s = req.session;
    var widget = new Paymentwall.Widget(s.username, 'p10_1', [], {'email': s.email});
    res.send(widget.getHtmlCode({'id': 'paywall', 'width': '100%', 'height': '800'}));
    console.log(widget.getHtmlCode());
  }

});

router.get('/community', function (req, res) {
  res.render('templates/community', { "title": 'Community' });
});

router.get('/chupastaff', function (req, res) {
  res.render('templates/chupastaff', {
    "title": 'Staff',
    "locales": cache.getLocales(),
    "staff": {
      realms: cache.getRealmlist(),
      realm: req.session.realm
    },
    "accounts": JSON.stringify(cache.getAccounts(), ["id", "username"]),
    "role": req.session.roles,
    "roles": cache.getRoles(),
    "worldDbStruct": cache.getWorldDbStruct()
  });
});

router.get('/help', function (req, res) {
  var i = cache.getLocaleIndex(req.session.lang);
  var loc = cache.getLocale(i);
  res.render('templates/help', { "title": 'help', "faq": loc.faq, "install": data.install, "i":i });
});

module.exports = router;
