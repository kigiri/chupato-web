var express = require('express');
var router = express.Router();
var db = require('../modules/database.js');
var data = require('../data/locales.js');
var cache = db.getCache();
var roles = db.getRoles();
var markdown = require('markdown').markdown;

router.post('/new/', '/new', function (req, res) {
  // if not logged, return 500
  // if logged verify if has right to post in this category
  //validate posted data :
//  var posted = req.body;
//  if ((typeof posted.title === "string")
//      && (typeof posted.markdown === "string")
//      && (cache.getAccount()  === "string")



  if ((posted.name && posted.adr) && (req.session.roles & (roles["CM"] | roles["WEB"]))) {
    res.end('SUCCESS');
  }
  else
    res.send(500);
});

router.post('/edit/', '/edit', function (req, res) {
  var posted = req.body;
  if ((posted.name && posted.adr) && (req.session.roles & (roles["CM"] | roles["WEB"]))) {
    res.end('SUCCESS');
  }
  else
    res.send(500);
});

router.get('/all/', '/all', function (req, res) {
  res.json(cache.getTopics());
});

router.get('/search/:keywords', '/search/:keywords/', function (req, res) {
  var keywords = req.param('keywords').split(' ');
  var mergedTopics = [];
  for (var i = keywords.length - 1; i >= 0; i--) {
    var topics = cache.searchTopics(keywords[i]);
    var mergedTopicsLength = mergedTopics.length - 1;
    for (var j = topics.length - 1; j >= 0; j--) {
      var id = topics[j].topic.id;
      for (var k = mergedTopics; k >= 0; k--) {
        if (mergedTopics[k].topic.id === id)
          break;
      }
      if (k < 0) {
        mergedTopics.push(topics[j]);
      }
      else {
        mergedTopics[k].score += topics[j].score;
      }
    }
  }
  res.json(mergedTopics.sort(function (a,b) { return b.score - a.score; }));
});

router.get('/id/:topicId', '/id/:topicId/', function (req, res) {
  var topic = cache.getTopic(parseInt(req.param('topicId')));
  res.json(topic);
});

router.post('/delete/', '/delete', function (req, res) {
  var posted = req.body;
  if ((posted.name && posted.adr) && (req.session.roles & (roles["CM"] | roles["WEB"]))) {
    res.end('SUCCESS');
  }
  else
    res.send(500);
});

console.log( markdown );

module.exports = router;
