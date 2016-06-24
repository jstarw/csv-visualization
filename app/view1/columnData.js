var columnData = view1Ctrl.directive('columnData', ['d3Service', function(d3Service) {
  function link(scope, element, attrs, barGraph) {
    scope.isIncluded = true;
    scope.isCategorized = false;
    scope.categories;
    scope.isEvenlyDistributed = false;

    scope.$watch('isIncluded', function(newVal) {
      if (newVal==false) {
        scope.isCategorized = false;
        scope.categories = null;
        scope.isEvenlyDistributed = false;
      }
    });
    scope.$watch('isCategorized', function(newVal) {
      if (newVal==false) {
        scope.categories = null;
        scope.isEvenlyDistributed = false;
      }
    });
    scope.$watch('categories', function(newVal) {
      if (newVal==null || newVal=='') {
        scope.isEvenlyDistributed = false;
      } else scope.$broadcast('bin_number_changed', newVal);
    });
  }
  return {
    restrict: 'EA',
    templateUrl: 'view1/columnData.html',
    scope: {
      column: '=column'
    },
    link: link
  }
}]);