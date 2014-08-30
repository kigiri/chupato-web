//https://github.com/mishoo/UglifyJS2
var UglifyJS = require("uglify-js");
var fs = require('fs');

var minify = module.exports = function() {
  fs.writeFile('public/javascripts/app.min.js',
      UglifyJS.minify([
        "public/javascripts/imports/angular.min.js",
        "public/javascripts/imports/angular-ui-router.min.js",
        "public/javascripts/imports/angular-sanitize.min.js",
        "public/javascripts/imports/socket.io.js",
        "public/javascripts/app.js",
        "public/javascripts/services/links.js",
        "public/javascripts/controllers/chupastaffCtrl.js",
        "public/javascripts/controllers/communityCtrl.js",
        "public/javascripts/controllers/eventCtrl.js",
        "public/javascripts/controllers/forumCtrl.js",
        "public/javascripts/controllers/helpCtrl.js",
        "public/javascripts/controllers/homeCtrl.js",
        "public/javascripts/controllers/menuCtrl.js",
        "public/javascripts/controllers/shopCtrl.js"
      ], { 'mangle': false }).code,
      function (err) {
        if (err) throw err;
        console.log("Front-end javascript minified in public/javascripts/app.min.js");
      }
  );
}


