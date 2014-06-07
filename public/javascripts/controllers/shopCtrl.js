angular
  .module('app')
  .controller('shopCtrl', ['$scope', function($scope) {
    $scope.title = "Shop";
    angular.element(document.querySelector('.current')).removeClass('current');
    angular.element(document.querySelector('#shop')).addClass('current');
  }]);
