angular
  .module('app')
  .controller('communityCtrl', ['$scope', function($scope) {
    $scope.title = "Community";
    angular.element(document.querySelector('.current')).removeClass('current');
    angular.element(document.querySelector('#community')).addClass('current');
  }]);
