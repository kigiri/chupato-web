angular
  .module('app')
  .controller('homeCtrl', ['$scope', function($scope) {
    $scope.title = "Home";
    angular.element(document.querySelector('.current')).removeClass('current');
    angular.element(document.querySelector('#home')).addClass('current');
  }]);
