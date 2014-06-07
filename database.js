var mysql = require('mysql');
var sha1 = require('sha1');
var db_config = require('./config');
var locales = [{ name:"common" }, { name:"en" }, { name:"fr" }];
var connection;
var accounts;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect(function(err) {
    if(err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

function initCacheLocales(cache, localeIndex) {
    connection.query("SELECT name, adr, icon, sorted FROM website.links WHERE locale IN (0, ?)", localeIndex,  function (err, docs) {
        if (err) { console.log(err); }
        else { cache.setLink(this.values, docs); }
    });
    connection.query("SELECT q AS question, a AS answer FROM website.faq WHERE locale IN (0, ?)", localeIndex,  function (err, docs) {
        if (err) { console.log(err); }
        else { cache.setFaq(this.values, docs); }
    });
}

function initCacheAuthData(cache) {
    connection.query("SELECT id, username, sha_pass_hash AS hash FROM chupato_auth.account", function (err, docs) {
        if (err) { console.log(err); }
        else { cache.setAccounts(docs); }
    });
}

function insertLink(cache, name, adr, icon, localeIndex) {
    connection.query('INSERT INTO website.links (name, adr, icon, locale) VALUES (?, ?, ?, ?);', [name, adr, icon, localeIndex],
        function (err, docs) {
            if (err)
                console.log(err);
            else {
                var v = this.values;
                if (v[3] == 0) {
                    for (var i = locales.length - 1; i > 0; i--)
                        locales[i].links.push({ name: v[0], adr: v[1], icon: v[2], sorted: 1 });
                }
                else
                    locales[v[3]].links.push({ name: v[0], adr: v[1], icon: v[2], sorted: 1 });
            }
        }
    );
}

handleDisconnect();

var cache = {
    setLink: function(index, links) { locales[index].links = links; },
    setFaq: function(index, faq) { locales[index].faq = faq; },
    setAccounts: function(accounts_sql) { accounts = accounts_sql; },
    addLink: function(name, adr, icon, common) {
        if (common)
            insertLink(this, name, adr, icon, 0);
        else {
            for (var i = locales.length - 2; i >= 0; i--)
                insertLink(this, name[i], adr[i], icon, i + 1);
        }
    },
    getLocales: function() { return locales; },
    getLocaleIndex: function(locale) {
        if (isNaN(locale)) {
            for (var i = locales.length - 1; i >= 0; i--) {
                if (locales[i].name == locale)
                    return i;
            }
        }
        return 1;
    },
    getLocale: function(locale) {
        if (isNaN(locale)) {
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
    }
};

cache.reload();

var auth = {
    makeHash: function(account, pass) { return sha1(account.toUpperCase() + ':' + pass.toUpperCase()); },
    getHash:  function(account) {
        for (var i = accounts.length - 1; i >= 0; i--) {
            if (accounts[i].username == account)
                return accounts[i].hash;
        };
        return false;
    },
    login: function(session, username, pass) {
        var ret = this.getHash(username);
        if (ret === false)
            return "ERR_FOUND"; // Account not found
        if (ret == this.makeHash(username, pass)) {
            username = username[0] + username.slice(1).toLowerCase();
            session.username = username;
            session.state = 'on';
            return username;
        }
        return "ERR_MATCH"; // Account and Password doesn't match
    },
};

var database = module.exports = {
    getCache:       function() { return cache; },
    getAuth:        function() { return auth; },
    getMysql:       function() { return mysql; },
    getConnection:  function() { return connection; },
};
