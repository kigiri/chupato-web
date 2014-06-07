angular
  .module('app')
  .controller('chupastaffCtrl', ['$scope', function($scope) {
    $scope.title = "Community";
    angular.element(document.querySelector('.current')).removeClass('current');
  }]);
