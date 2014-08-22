var sql = module.exports = {
  "SELECT": {
    "links": "SELECT name, adr, icon, sorted FROM website.links WHERE locale IN (0, ?)",
    "faq": "SELECT q AS question, a AS answer FROM website.faq WHERE locale IN (0, ?)",
    "realmlists": "SELECT id, name FROM chupato_auth.realmlist",
    "accounts": "SELECT
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
        ON (x.id = a.id);",
  },
  "INSERT": {
    "link": "INSERT INTO website.links (name, adr, icon, locale) VALUES (?, ?, ?, ?);",
    "account": "INSERT INTO chupato_auth.account (username, sha_pass_hash, email) VALUES (?, ?, ?);",
  },
  "REPLACE": {
    "userdata": "REPLACE INTO website.userdata (id, role) VALUES (?, ?);",
    "account_access":'REPLACE INTO chupato_auth.account_access (id, gmlevel, RealmID) VALUES (?, ?, ?);',
  },
};


