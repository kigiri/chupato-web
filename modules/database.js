var mysql = require('mysql');
var sha1 = require('sha1');
var db_config = require('./config');
var queries = require('../data/queries.js');
var locales = [{ name:"common" }, { name:"en" }, { name:"fr" }];
var markdown = require('markdown').markdown;
var connection;
var accounts;
var realmlist;
var topics;
var gameLogs = [];
var lastGameLogId = 0;
var worldDbStruct = [];
var flush = [];
var roles = {
  "VIP":1,
  "GM":2,
  "CM":4,
  "WEB":8,
  "SQL":16,
  "C++":32,
  "ADMIN":64
};
function getFnName(fn) {
  var f = typeof fn == 'function';
  var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
  return (!f && 'not a function') || (s && s[1] || 'anonymous');
}

function getElementFromId(array, key, id) {
  var i = array.length;
  if (id < i)
    i = id;
  while (--i >= 0) {
    if (array[i][key] == id)
      return array[i];
  }
  return false;
}

function handleDisconnect() {
  connection = mysql.createConnection(db_config.global);
  connection.connect(function(err) {
    if(err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect(), 2000);
    }
  });

  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else { throw err;}
  });
}

function initStruct() {
  connection.changeUser(db_config.chupato, function (err) { if (err) throw err; });
  connection.query(queries.SELECT.tables, function (err, docs) {
    if (err) { console.log(queries.SELECT.tables, err); }
    else {
      connection.changeUser(db_config.chupato, function (err) { if (err) throw err; });
      var key;
      for (var index in docs) {
        if (!key) {
          for (var keyTmp in docs[index]) {
            if (docs[index].hasOwnProperty(keyTmp) && typeof(keyTmp) !== 'function') {
              key = keyTmp;
              break;
            }
          }
        }
        var tableName = docs[index][key];
        connection.query(queries.SELECT.fields, ["chupato_world", tableName],
        function (err, docs) {
          if (err) { console.log(queries.SELECT.fields, err); }
          else { worldDbStruct.push({ 'name': this.values[1], 'fields': docs }); }
        });
      }
      connection.changeUser(db_config.default, function (err) { if (err) throw err; });
    }
  });
  connection.changeUser(db_config.default, function (err) { if (err) throw err; });
}

function initCacheLocales(cache, localeIndex) {
  connection.query(queries.SELECT.links, localeIndex, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else { cache.setLink(this.values, docs); }
  });
  connection.query(queries.SELECT.faq, localeIndex, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else { cache.setFaq(this.values, docs); }
  });
}

function initCacheAuthData(cache) {
  connection.query(queries.SELECT.accounts, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else {
      cache.setAccounts(docs);
      reloadCharacters(cache);
    }
  });
  connection.query(queries.SELECT.realmlists, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else { cache.setRealmlist(docs); }
  });
}

function initCacheTopics() {
  connection.query(queries.SELECT.topics, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else {
      topics = docs;
      for (var i = topics.length - 1; i >= 0; i--) {
        var topic = topics[i];
        topic.html = markdown.toHTML(topic.markdown);
        topic.fr_html = topic.fr_markdown ? markdown.toHTML(topic.fr_markdown) : '';
      }
      console.log(topics);
    }
  });
}

function reloadCharacters(cache) {
  cache.prepareCharacters();
  connection.query(queries.SELECT.characters.online, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else {
      var onlineUsers = docs;
      cache.updateCharacters(docs);
      if (docs.length > 1000) { return; }
      connection.query(queries.SELECT.characters.active, (1000 - docs.length), function (err, docs) {
        if (err) { console.log(getFnName(this), "->", err); }
        else { cache.updateCharacters(docs); }
      });
    }
  });
}

function getNewGameLogs(cb, lastGameLogId) {
  connection.query(queries.SELECT.gameLogs, lastGameLogId, function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else { cb(docs); }
  });
}

function insertLink(cache, name, adr, icon, localeIndex) {
  connection.query(queries.INSERT.link, [name, adr, icon, localeIndex],
  function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else {
      var v = this.values;
      if (v[3] == 0) {
        for (var i = locales.length - 1; i > 0; i--)
        locales[i].links.push({ name: v[0], adr: v[1], icon: v[2], sorted: 1 });
      }
      else { locales[v[3]].links.push({ name: v[0], adr: v[1], icon: v[2], sorted: 1 }); }
    }
  });
}
/*
  topic is an array of
    answerTo
    postedBy
    category
    title
    markdown
    fr_title (can be null)
    fr_markdown (can be null)
*/
function insertTopic(cache, topic) {
  connection.query(queries.INSERT.topic, topic,
  function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else {
      var v = this.values;
      topics.push({
        'id':docs.insertId,
        'answerTo': v[0],
        'postedBy': v[1],
        'editedBy': null,
        'deletedBy': null,
        'category': v[2],
        'editDate': null,
        'postDate': new Date(),
        'title': v[3],
        'markdown': v[4],
        'html': markdown.toHTML(v[4]),
        'fr_title': v[5],
        'fr_markdown': v[6],
        'fr_html': v[6] ? markdown.toHTML(v[6]) : null
      });
    }
  });
}
// updatedTopic [editedBy, deletedBy, title, markdown, fr_title, fr_markdown, id]
function updateTopic(cache, updatedValues) {
  connection.query(queries.UPDATE.topic, [
    updatedValues.editedBy,
    updatedValues.deletedBy,
    updatedValues.title,
    updatedValues.markdown,
    updatedValues.fr_title,
    updatedValues.fr_markdown,
    updatedValues.id
  ],
  function (err, docs) {
    if (err) { console.log(getFnName(this), "->", err); }
    else {
      var topic = cache.getTopic(updatedValues.id);
      topic.editedBy = updatedValues.editedBy;
      topic.deletedBy = updatedValues.deletedBy;
      topic.editDate = new Date();
      topic.title = updatedValues.title;
      topic.markdown = updatedValues.markdown;
      topic.html = markdown.toHTML(updatedValues.markdown);
      topic.fr_title = updatedValues.fr_title;
      topic.fr_markdown = updatedValues.fr_markdown;
      topic.fr_html = updatedValues.fr_markdown ? markdown.toHTML(updatedValues.fr_markdown) : null;
    }
  });
}

function updateUserdata(key, value, id) {
  connection.query(queries.UPDATE.userdata(key), [value, id],
    function (err, docs) {
      if (err) { console.log(getFnName(this), "->", err); }
      else {
        var id = this.values[1];
        for (var i = accounts.length - 1; i >= 0; i--) {
          if (accounts[i].id == id) {
            accounts[i][key] = this.values[0];
            flush.push(accounts[i].username);
            break;
          }
        }
      }
    }
  );
}

function promoteInGame(data) {
  connection.query(queries.REPLACE.accountAccess, [data.id, data.gmlevel, data.realm],
    function (err, docs) {
      if (err) { console.log(getFnName(this), "->", err); }
      else {
        console.log("InGame User Promoted :", this.values);
        var id = this.values[0];
        for (var i = accounts.length - 1; i >= 0; i--) {
          if (accounts[i].id == id) {
            accounts[i].gmlevel = this.values[1];
            accounts[i].realm = this.values[2];
            break;
          }
        }
      }
    }
  );
}

function insertUser(username, hash, email) {
  connection.query(queries.INSERT.account, [username, hash, email],
    function (err, docs) {
      if (err) { console.log(getFnName(this), "->", err); }
      else {
        var id = docs.insertId;
        connection.query(queries.INSERT.userdata, id, function (err, docs) { if (err) console.log(err); });
        accounts.push({ 'id': id, 'username': this.values[0], 'hash': this.values[1] });
      }
    }
  );
}

function updateSession(session, account) {
  session.roles = account.roles;
  session.realm = account.realm;
  session.email = account.email;
  session.userId = account.id;
  session.lang = account.lang;
  session.cp = account.cp; // Contribution Points
}


function getAccountFromUsername(username) {
  for (var i = accounts.length - 1; i >= 0; i--) {
    if (accounts[i].username == username)
      return accounts[i];
  }
  return false;
}
function getAccountFromId(id, start) {
  if (start) {
    for (var itr = 0; itr < accounts.length; itr++) {
      if (accounts[start].id === id)
        return accounts[start];
      start++;
      if (start + 1 > accounts.length)
        start = 0;
    }
  } else {
    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i].id === id)
        return accounts[i];
    }
  }
  return false;
}

function formatPlayerFrom(s) {
  return {
    'id':     s.player,
    'team':   s.team,
    'rating': s.rating,
    'dmg':    s.dmg,
    'heal':   s.heal,
    'kill':   s.kill,
    'mod':    s.mod
  };
}

handleDisconnect();
initStruct();

var cache = {
  mustFlush: function(account) {
    for (var i = flush.length - 1; i >= 0; i--) {
      if (flush[i] === account) {
        flush.splice(i, 1);
        return true;
      }
      return false;
    };
  },
  updateGameLogs: function(cb) {
    getNewGameLogs(function (newLogs) {
      if (!newLogs || !newLogs.length) return;
      var mergedLogs = [];
      var i = 0;
      var max = newLogs.length;

      while (i < max) {
        var currentLog = newLogs[i];
        var j = i + 1;
        var formatedLog = { 'id':currentLog.id, 'time':currentLog.time  };

        if (currentLog.data1 < 0) {
          var players = [];
          if (currentLog.player) {
            players.push(formatPlayerFrom(currentLog));
          }

          while (j < max && (currentLog.id === newLogs[j].id)) {
            players.push(formatPlayerFrom(newLogs[j]));
            j++;
          }
          formatedLog.logType   = "arena";
          formatedLog.arenaType = -currentLog.data1;
          formatedLog.winners   = currentLog.data2;
          formatedLog.duration  = currentLog.data3;
          formatedLog.players   = players;
        } else {
          formatedLog.logType = "ffa";
          formatedLog.honor  = -currentLog.data1;
          formatedLog.killer = currentLog.data2;
          formatedLog.victim = currentLog.data3;
        }
        i = j;
        mergedLogs.push(formatedLog);
      };
      if (mergedLogs.length) {
        gameLogs = gameLogs.concat(mergedLogs);
        lastGameLogId = mergedLogs[mergedLogs.length-1].id;
        cb(mergedLogs);
      }
      else console.log("ERROR : unable to merge game logs from ID: ", newLogs[0].id, "+");
    }, lastGameLogId);
  },
  updateSession: function(session) { updateSession(session, getAccountFromUsername(session.username)) },
  defaultSession: function(session) {
    this.mustFlush(session.username);
    if (!session.lang)
      session.lang = 'en';
    if (!session.lastTryTimeout)
      session.lastTryTimeout = false;
    if (!session.tryCount)
      session.tryCount = 0;
    session.roles = 0;
    session.state = 'off';
    session.username = '';
    session.email = '';
    session.realm = 0;
  },
  getWorldDbStruct: function() { return worldDbStruct; },
  setLink: function(index, links) { locales[index].links = links; },
  setFaq: function(index, faq) { locales[index].faq = faq; },
  setAccounts: function(data) { accounts = data; },
  setGameLogs: function(data) { gameLogs = data; },
  getGameLogs: function() { return gameLogs; },
  prepareCharacters: function() {
    for (var i = accounts.length - 1; i >= 0; i--) {
      accounts[i].characters = [];
    }
  },
  updateTopic: function(updatedValues) { updatedTopic(this, updatedValues); },
  updateCharacters: function(characters) {
    console.log(characters.length);

    var account = {id:0};
    for (var i = 0; i < characters.length; i++) {
      var character = characters[i];
      account = getAccountFromId(character.account, account.id);
      if (account === false) { return; }
      account.characters.push(character);
    };
    console.log(accounts[0].characters.length);
  },
  setRealmlist: function(data) { realmlist = data; },
  getRealm: function(realmID) {
    if (realmID === -1)
      return realmlist[1];
    for (var i = realmlist.length - 1; i >= 0; i--) {
      if (realmlist[i].id == realmID)
        return realmlist[i];
    }
    return false;
  },
  updateUserdata: updateUserdata,
  getRealmlist: function() { return realmlist; },
  getAccounts: function() { return accounts; },
  getAccount: function(idOrName) {
    if (typeof idOrName === "string")
      return getAccountFromUsername(idOrName);
    return getElementFromId(accounts, "id", id);
  },
  getRoles: function() { return roles; },
  searchTopics: function(keyword) {
    keyword = keyword.toLowerCase();
    keywordLength = keyword.length;
    if (keywordLength < 4)
      return false;
    var matchedTopics = [];
    for (var i = topics.length - 1; i >= 0; i--) {
      var score = 0;
      if (topics[i].title.toLowerCase().search(keyword) >= 0)
        score = 50;
      var text = topics[i].markdown.toLowerCase();
      var j = text.search(keyword);
      var currentIndex = 0;
      // enough for temporary search features, should use a real search engine later on, maybe elasticsearch
      while (j >= 0) {
        currentIndex += j + keywordLength;
        j = text.substring(currentIndex).search(keyword);
        score++;
      }
      if (score)
        matchedTopics.push({'score': score, 'topic': topics[i]});
    }
    return (matchedTopics.length) ? matchedTopics.sort(function(a, b) { return b.score - a.score; }) : false;
  },
  getTopics: function() { return topics; },
  getTopic: function(id) { return getElementFromId(topics, "id", id); },
  addTopic: function(topic) {
    insertTopic(this, [
      topic.answerTo,
      topic.postedBy,
      topic.category,
      topic.title,
      topic.markdown,
      topic.fr_title ? topic.fr_title : null,
      topic.fr_markdown ? topic.fr_markdown : null
    ]);
  },
  addLink: function(name, adr, icon, common) {
    if (common)
      insertLink(this, name, adr, icon, 0);
    else {
      for (var i = locales.length - 2; i >= 0; i--)
        insertLink(this, name[i], adr[i], icon, i + 1);
    }
  },
  promote: function(data) {
    updateUserdata("roles", data.roles, data.id);
    if (data.gmlevel)
      promoteInGame(data);
  },
  getLocales: function() { return locales; },
  getLocaleIndex: function(locale) {
    if (typeof locale === "string") {
      for (var i = locales.length - 1; i >= 0; i--) {
        if (locales[i].name == locale)
          return i;
      }
    }
    return 1;
  },
  getLocale: function(locale) {
    if (typeof locale === "string") {
      for (var i = locales.length - 1; i >= 0; i--) {
        if (locales[i].name == locale)
          return locales[i];
      }
    } else {
      if (locale < locales.length)
        return locales[locale];
    }
    return locales[1]; // not found return English
  },
  reload: function() {
    for (var i = locales.length - 1; i >= 0; i--)
      initCacheLocales(this, i);
    initCacheAuthData(this);
    initCacheTopics();
    lastGameLogId = 0,
    gameLogs = [],
    this.updateGameLogs(function () {});
  }
};

cache.reload();

var auth = {
  makeHash: function(account, pass) { return sha1(account.toUpperCase() + ':' + pass.toUpperCase()); },
  getAccount: getAccountFromUsername,
  login: function(session, username, pass) {
    var ret = getAccountFromUsername(username);
    if (ret === false)
      return "ERR_FOUND"; // Account not found
    if (ret.hash == this.makeHash(username, pass)) {
      username = username[0] + username.slice(1).toLowerCase();
      session.username = username;
      session.state = 'on';
      updateSession(session, ret);
      return username;
    }
    return "ERR_MATCH"; // Account and Password doesn't match
  },
  register: function(session, username, pass, email) {
    if (getAccountFromUsername(username) !== false)
      return "ERR_ALREADY_EXISTS";
    if (username.length < 2)
      return "ERR_TOO_SHORT";
    if (username.length > 14)
      return "ERR_TOO_LONG";
    if (!username.match(/^[0-9a-zA-Z-_.]{2,14}$/))
      return "ERR_INVALID";
    if (!email.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/))
      return "ERR_MAIL_FORMAT";
    console.log(">>> New User : ", username);
    insertUser(username, this.makeHash(username, pass), email);
    username = username[0] + username.slice(1).toLowerCase();
    session.username = username;
    session.state = 'on';
    return username;
  },
};

var database = module.exports = {
  getCache:       function () { return cache; },
  getAuth:        function () { return auth; },
  getMysql:       function () { return mysql; },
  getConnection:  function () { return connection; },
  getRoles:       function () { return roles; },
  executeRawSQL:  function (res, query, realmID) {
    console.log("recived :", realmID);
    var realm = cache.getRealm(realmID);
    console.log("found realm :", realm);
    if (!realm) { res.json({'Error':'Invalid Realm ID (' + realmID + ').' }); return; }
    var user = db_config[realm.name.toLowerCase()];
    console.log("found user :", user);
    if (!user) { res.json({'Error':'Unable to find the mysql account for this Realm (' + realm.name + ').'}); return; }
    connection.changeUser(user, function (err) { if (err) throw err; });
    connection.query(query, function (err, docs) {
      if (err) { res.json({'Error':err}) }
      else { res.json(docs) }
      connection.changeUser(db_config.default);
    });
  },
};
