var express = require('express');
var router = express.Router();
var db = require('../database.js');
var data = require('../data/locales.js');
var cache = db.getCache();

router.get('/home', function  (req, res) {
  res.render('templates/home', { title: 'Home' });
});

router.get('/forum', function (req, res) {
  res.render('templates/forum', { title: 'Forum' });
});

router.get('/shop', function (req, res) {
  res.render('templates/shop', { title: 'Shop' });
});

router.get('/community', function (req, res) {
  res.render('templates/community', { title: 'Community' });
});

router.get('/sql', function (req, res) {
  res.render('templates/community', { title: 'Community' });
});

router.get('/chupastaff', function (req, res) {
  res.render('templates/chupastaff', { title: 'Staff', locales: cache.getLocales() });
});

router.get('/help', function (req, res) {
  var i = cache.getLocaleIndex(req.session.lang);
  var loc = cache.getLocale(i);
  res.render('templates/help', { "title": 'help', "faq": loc.faq, "install": data.install, "i":i });
});

module.exports = router;
