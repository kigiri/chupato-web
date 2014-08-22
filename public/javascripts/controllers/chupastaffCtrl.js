angular
  .module('app')
  .controller('chupastaffCtrl', ['$scope', '$http', '$filter', function($scope, $http, $filter) {
    $scope.title = "Community";
    $scope.promote = { };
    $scope.consoleSQL = '';
    $scope.rawSQL = '';
    $scope.show = { 'db':false, 'field':false, 'where':false };
    $scope.selected = { 'db':false };
    angular.element(document.querySelector('.current')).removeClass('current');

    $scope.sqlEditor = {
      keyMap:'sublime',
      theme:'drk',
      dragDrop:false,
      tabSize: 2,
      lineWrapping : true,
      lineNumbers: true,
      mode: "text/x-sql",
    };
    $scope.jsonFormating = {
      keyMap:'sublime',
      dragDrop:'false',
      theme:'drk',
      tabSize: 4,
      lineWrapping : false,
      lineNumbers: true,
      readOnly: true,
      mode: {name: "javascript", json: true},
    };
    $scope.setSelect = function (data) {
      $scope.selected.db = data;
      $scope.selected.db.where = data.fields;
      $scope.show.db = false;
      $scope.dbFilter = '';
    }
    $scope.moveElem = function (data, add) {
      var arr;
      if (typeof $scope.selected.db.pickedFields === "undefined")
        $scope.selected.db.pickedFields = [];
      if (add)
        arr = $scope.selected.db.fields;
      else
        arr = $scope.selected.db.pickedFields;
      console.log(arr, data, add);
      for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i].name === data) {
          if (add) {
            $scope.selected.db.pickedFields.push(arr[i]);
            $scope.selected.db.fields.splice(i, 1);
          } else {
            $scope.selected.db.fields.push(arr[i]);
            $scope.selected.db.pickedFields.splice(i, 1);
          }
          break;
        }
      }
      console.log(i);
    }
    $scope.updateWhere = function (data, add) {
    }
    $scope.toggleMenu = function (key) {
      for (var i in $scope.show) {
        if ((i === key) || ($scope.show[i] === true))
          $scope.show[i] = !$scope.show[i];
      }
    }
    $scope.saveUser = function (account) {
      $scope.waiting = true;
      $http.post('/staff/user', account)
      .then(function (result) {
        var data = result.data;
        if (isNaN(data)) {
          $scope.promote.id = account.id;
          $scope.promote.username = account.username;
          $scope.promote.roles = data.roles;
          $scope.promote.gmlevel = data.gmlevel;
          $scope.promote.realm = data.realm;
          $scope.accountSelected = account.username + " [x]";
          $scope.postMessage = '';
        }
        else {
          switch (data) {
            case "1": $scope.postMessage = 'Connection has been lost, please relog.'; break;
            case "2": $scope.postMessage = 'Wrong promote data'; break;
            case "3": $scope.postMessage = "Your account don't have access to this service"; break;
          }
        }
        $scope.waiting = false;
      });
    }
    $scope.resetUser = function () {
      $scope.promote.roles = '';
      $scope.promote.gmlevel = '';
      $scope.promote.realm = '';
      $scope.promote.id = "";
      $scope.accountSelected = "Select an account";
      $scope.postMessage = 'No user selected';
    }
    $scope.resetUser();
    $scope.isChecked = function (role) { return ($scope.promote.roles & role); }
    $scope.submitPromote = function () {
      var postData = $scope.promote;
      postData.roles = 0;
      for (var key in $scope.roles) {
        var val =  $scope.roles[key];
        if (angular.element(document.querySelector('#role-' + val))[0].checked === true)
          postData.roles += val;
      }
      $scope.waiting = true;
      $http.post('/staff/promote', postData)
      .then(function (result) {
        if (result.data === "SUCCESS")
          $scope.postMessage = "Account " + postData.id + " succesfully promoted.";
        else
          $scope.postMessage = result.data;
        $scope.waiting = false;
      });
    }
    $scope.submitLink = function () {
      console.log($scope.newlink);
      $http.post('/staff/link', $scope.newlink)
      .then(function (result) {
        console.log(result);
      });
    }
    $scope.submitSQL = function () {
      $scope.waitingSQL = true;
      $http.post('/staff/sql', {'sql':$scope.rawSQL})
      .then(function (result) {
        var obj = result.data;
        if (typeof obj == "string")
          obj = {"error":obj};
        $scope.consoleSQL = obj;
        $scope.waitingSQL = false;
      });
    }
  }]);
