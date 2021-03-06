
var playerFields = " guid AS id, account, name, race, class, totaltime, pvprank, level, online ";
var queries = module.exports = {
  "SELECT": {
    "tables": "SHOW TABLES FROM chupato_world",
    "fields": "SELECT column_name AS name FROM information_schema.columns WHERE table_schema=? AND table_name=?",
    "links": "SELECT name, adr, icon, sorted FROM website.links WHERE locale IN (0, ?)",
    "faq": "SELECT q AS question, a AS answer FROM website.faq WHERE locale IN (0, ?)",
    "realmlists": "SELECT id, name FROM chupato_auth.realmlist",
    "topics":"SELECT * FROM website.topics",
    "characters": {
      "online":  "SELECT" + playerFields + "FROM chupato_characters.characters WHERE level > 9 AND online = 1 ORDER BY account",
      "active": "(SELECT" + playerFields + "FROM chupato_characters.characters WHERE totaltime > 3600 AND level > 9 AND deleteInfos_Account IS NULL ORDER BY logout_time DESC LIMIT ?) ORDER BY account",
      "refresh": "SELECT" + playerFields + "FROM chupato_characters.characters WHERE level > 9 AND (online = 1 OR (logout_time > ? AND totaltime > 3600 AND deleteInfos_Account IS NULL)) ORDER BY account",
    },
    "accounts": "SELECT a.id AS id, a.username AS username, a.sha_pass_hash AS hash, a.email AS email, w.lang AS lang, w.cp AS cp, w.roles AS roles, x.gmlevel AS gmlevel, x.RealmID AS realm, a.last_ip AS ip FROM chupato_auth.account AS a LEFT OUTER JOIN website.userdata as w ON (w.id = a.id) LEFT OUTER JOIN chupato_auth.account_access as x ON (x.id = a.id)",
    "gameLogs": "SELECT * FROM chupato_characters.webserver_log AS l LEFT OUTER JOIN chupato_characters.webserver_arena_stats AS a ON (a.log = l.id) WHERE id > ?",
  },
  "INSERT": {
    "link": "INSERT INTO website.links (name, adr, icon, locale) VALUES (?, ?, ?, ?)",
    "topic": "INSERT INTO website.topics (answerTo, postedBy, editedBy, deletedBy, category, editDate, postDate, title, markdown, fr_title, fr_markdown) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)",
    "account": "INSERT INTO chupato_auth.account (username, sha_pass_hash, email) VALUES (?, ?, ?)",
    "userdata": "INSERT INTO website.userdata (id) VALUES (?)",
  },
  "REPLACE": {
    "accountAccess":'REPLACE INTO chupato_auth.account_access (id, gmlevel, RealmID) VALUES (?, ?, ?)',
  },
  "UPDATE": {
    "topic": "UPDATE website.topics SET editedBy=?, deletedBy=?, editDate=NOW(), title=?, markdown=?, fr_title=?, fr_markdown=? WHERE id=?",
    "userdata": function (key) { return "UPDATE website.userdata SET " + key + "=? WHERE id=?" },
  }
};

/*


SELECT *
FROM
  chupato_characters.webserver_log AS l
LEFT OUTER JOIN
  chupato_characters.webserver_arena_stats AS a
    ON (a.log = l.id)
WHERE id > ?


SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'cyclone_world'
AND table_name = 'creature' ;

SELECT
  a.id AS id,
  a.username AS username,
  a.sha_pass_hash AS hash,
  IFNULL(w.lang, 'en') AS lang,
  IFNULL(w.roles, 0) AS roles,
  IFNULL(x.gmlevel, 0) AS gmlevel,
  IFNULL(x.RealmID, 0) AS realm
FROM
  chupato_auth.account AS a
LEFT OUTER JOIN
  website.userdata as w
    ON (w.id = a.id)
LEFT OUTER JOIN
  chupato_auth.account_access as x
    ON (x.id = a.id)
LIMIT 10;

*/
