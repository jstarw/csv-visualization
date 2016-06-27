var columnData = view1Ctrl.directive('columnData', ['d3Service', function(d3Service) {
  function link(scope, element, attrs, barGraph) {
    scope.isIncluded = true;
    scope.isCategorized = false;
    scope.categories;
    scope.isEvenlyDistributed = true;

    scope.$watch('isIncluded', function(newVal) {
      if (newVal==false) {
        scope.isCategorized = false;
        scope.categories = null;
        scope.isEvenlyDistributed = true;
      }
    });
    scope.$watch('isCategorized', function(newVal) {
      if (newVal==false) {
        scope.categories = null;
        scope.isEvenlyDistributed = true;
      }
    });
    scope.$watch('categories', function(newVal) {
      if (newVal==null || newVal=='') {
        scope.isEvenlyDistributed = true;
        scope.$broadcast('remove_histogram');
      } else scope.$broadcast('bin_number_changed', newVal);
    });
    scope.$watch('isEvenlyDistributed', function(newVal) {
      if (newVal==false && scope.categories) {
        scope.$broadcast('add_draggable');
      } 
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