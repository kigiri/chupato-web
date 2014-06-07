var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/users', function (req, res) {
  connection.query('SELECT * FROM nodejs', function(err, docs) {
  res.render('users', {users: docs});
  });
});

// Add a new User
router.get("/users/new", function (req, res) {
  res.render('new', { title: 'new' });
});

module.exports = router;
