
var app = angular
  .module('app', [
    'ui.router',
    'ngSanitize'
  ])
  .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '/home-template',
        controller: 'homeCtrl'
      })
      .state('help', {
        url: '/help',
        templateUrl: '/help-template',
        controller: 'helpCtrl'
      })
      .state('forum', {
        url: '/forum',
        templateUrl: '/forum-template',
        controller: 'forumCtrl'
      })
      .state('shop', {
        url: '/shop',
        templateUrl: '/shop-template',
        controller: 'shopCtrl'
      })
      .state('community', {
        url: '/community',
        templateUrl: '/community-template',
        controller: 'communityCtrl'
      })
      .state('chupastaff', {
        url: '/chupastaff',
        templateUrl: '/chupastaff-template',
        controller: 'chupastaffCtrl'
      });
  }]);

app.factory('chupaData', function($http) {
  var fac = {};
  //var username = '';
  var selectors = [
    angular.element(document.querySelector('#name-tf')),
    angular.element(document.querySelector('#pass-tf')),
    angular.element(document.querySelector('#confirm-tf')),
    angular.element(document.querySelector('#email-tf')) ];
  //fac.setUsername = function(value) { username = value; };
  //fac.getUsername = function() { return username; };
  fac.getSelectors = function() { return selectors; };
  fac.reset = function() { username = ''; };
  return fac;
});

app.controller('menuCtrl', function($scope, $timeout, $http, chupaData) {

  function init() {
    $scope.sel = chupaData.getSelectors();
    $scope.searchPosition = 0;
    $timeout(countDown, 500);
  }

  function moveInForm(value, selector) {
    $scope.active = value;
    if (!angular.isUndefined(selector)) {
      $timeout(function() {
        selector[0].focus();
        selector[0].select();
      }, 10);
    }
  }

  function countDown() {
    if ($scope.tryLeft < -1) {
      $scope.tryLeft++;
      $timeout(countDown, 1000);
    }
    else { $scope.tryLeft = 3; }
  }

  function hasErrors() {
    if ($scope.active === 1 && $scope.tryLeft < 0)
      return sendError(7);
    var a = $scope.auth;
    if (!a.account)
      return sendError(2, $scope.sel[0]);
    if (a.account.length < 2)
      return sendError(4, $scope.sel[0]);
    if (a.account.length > 14)
      return sendError(3, $scope.sel[0]);
    if (!a.account.match(/^[0-9a-zA-Z-_.]{2,14}$/))
      return sendError(2, $scope.sel[0]);
    if (!a.pass || !a.pass.match(/^[0-9a-zA-Z-_.]{2,40}$/))
      return sendError(6, $scope.sel[1]);
    if ($scope.active === 1)
      return false;
    if ((!a.email) || (!a.email.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/)))
      return sendError(1, $scope.sel[3]);
    if ($scope.active === 2)
      return false;
    if (a.pass != a.confirm)
      return sendError(5, $scope.sel[2]);
  }

  function sendError(value, selector) {
    $scope.state = value;
    if (!angular.isUndefined(selector)) {
      $timeout(function() {
        selector[0].focus();
        selector[0].select();
      }, 10);
    }
    $timeout(function() {
      $scope.state = "off";
    }, 5000);
    return true;
  }

  function startCountDown(total, delay) {
    $scope.tryLeft = -total;
    $timeout(countDown, delay);
  }

  $scope.authClick = function(action) {
    switch (action) {
      case 'login': moveInForm(1, $scope.sel[0]); break;
      case 'inscription': moveInForm(2, $scope.sel[0]); break;
      case 'next': if (!hasErrors()) moveInForm(3, $scope.sel[2]); break;
      case 'prev':
        if ($scope.active === 3) { moveInForm(2, $scope.sel[0]); }
        else { moveInForm(0); } break;
      case 'logout': $http.post('/logout'); $scope.state = "off"; break;
      case 'submit':
        if (!hasErrors()) {
          if ($scope.active === 1) {
            $http.post('/login', { account: $scope.auth.account, pass: $scope.auth.pass }).then(function(result) {
              var ret = result.data;
              $scope.tryLeft--;
              if ($scope.tryLeft < 1) { startCountDown(59, 1000); }
              if (!isNaN(ret)) {
                var sec = Math.floor(ret / 1000);
                var left = (ret - (sec * 1000)) - 50;
                if (left > 0) { left = 1; }
                startCountDown(sec, left);
              }
              else {
                switch (ret) {
                  case "ERR_FOUND": sendError(2, $scope.sel[0]); break;
                  case "ERR_MATCH": sendError(6, $scope.sel[1]); break;
                  default:
                    $scope.tryLeft = 3;
                    $scope.username = ret;
                    $scope.state = "on";
                    $scope.active = 0;
                  break;
                }
              }
            });
          } else { alert('Account creation Comming Soon :)'); }
        } break;
      default: break;
    }
  };
  $scope.setLang = function(lang) { window.location = window.location.origin + "/" + lang + "/" + window.location.hash; };

  $scope.onKeyPress = function($event) {
    var k = $event.keyCode;
    switch (k) {
      case 9: // Tab
        if (!$scope.searchInput)
          break;
        $event.preventDefault();
        if ($event.shiftKey) {
            $scope.searchPosition--;
        } else {
            $scope.searchPosition++;
        }
        break;
      case 13: // Enter
        if (angular.isUndefined($scope.searchInput))
          break;
        $event.preventDefault();
        var elem = angular.element(document.querySelector('#result-' + $scope.searchPosition));
        if (!elem.length)
          elem = angular.element(document.querySelector('#result-0'));
        var href = elem[0].href;
        //if (href.match(/^http\:\/\/chupato\.com\/\#/i) || elem.hasClass('alert')) {
          $scope.searchInput = '';
          window.location.href = href;
        //}
        //else
        //  elem.addClass('alert');
        break;
      case 40: // Down
        $event.preventDefault();
        $scope.searchPosition++;
        break;
      case 38: // Up
        $event.preventDefault();
        $scope.searchPosition--;
        break;
      case 27: // Esc
        if (angular.isUndefined($scope.searchInput))
          break;
        $event.preventDefault();
        $scope.searchInput = '';
        break;
      default:
        if ((k > 47 && k < 91) || (k > 95 && k < 112) || (k > 185))
          $scope.searchPosition = 0;
        break;
    }
    if (!angular.element(document.querySelector('#result-' + $scope.searchPosition)).length) {
      if ($scope.searchPosition > 0)
        $scope.searchPosition--;
      else
        $scope.searchPosition = 0;
    }
  }
  init();
})

app.filter('fuzzyFilter', function () {
  return function (items, pattern) {
    if (angular.isUndefined(items) || angular.isUndefined(pattern))
      return items;
    var patLen = pattern.length;
    if (patLen < 1)
      return items;

    var tempItems = [];
    for (var k = items.length - 1; k >= 0; k--) {
      var string = items[k].name;
      if (items[k].sorted == false) {
        items[k].html = '<span class="bold">' + pattern + '</span> <span class="italic">' + string + '...</span>';
        items[k].score = 0;
        tempItems.push(items[k]);
        continue;
      }
      pattern = pattern.toLowerCase();
      string = string.toLowerCase();
      var patternIdx = 0;
      var result = items[k].name.match(/[\s\S]{1}/g);
      var len = string.length;
      var totalScore = 0;
      var currScore = 0;
      var match = { "html":"", "score":0, "idx":0 };

      for(var idx = 0; idx < len; idx++) {
        if(string[idx] === pattern[patternIdx]) {
          patternIdx++;
          match.html = '<b>' + items[k].name[idx] + '</b>';
          var isCap = (items[k].name[idx] !== string[idx]);
          currScore += 1 + currScore;
          if (isCap)
            currScore++;
          if (!idx)
            match.currScore += 2;
          else if (string[idx - 1] == ' ')
            match.currScore++;
          match.score = currScore;
          match.idx = idx;
          result[idx] = match.html;
        } else
          currScore = 0;
        totalScore += currScore;
      }
      if(patternIdx === patLen) {
        items[k].html = result.join('');
        items[k].score = totalScore;
        tempItems.push(items[k]);
      }
    }
    return tempItems;
  }
});
