angular
  .module('app')
  .controller('forumCtrl', ['$scope', function($scope) {
    $scope.title = "Forum";
    angular.element(document.querySelector('.current')).removeClass('current');
    angular.element(document.querySelector('#forum')).addClass('current');
  }]);
