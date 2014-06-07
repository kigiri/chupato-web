angular
  .module('app')
  .controller('helpCtrl', ['$scope', 'chupaData', function($scope, chupaData) {
    $scope.title = "Help";
    angular.element(document.querySelector('.current')).removeClass('current');
    angular.element(document.querySelector('#help')).addClass('current');
    $scope.deployDiv = function (event, show) {
        var elem = event.target.nextSibling;
        var height = show ? elem.firstChild.clientHeight + 30 : 0 ;
        angular.element(elem).css('height',  height + "px");
    }
  }]);
