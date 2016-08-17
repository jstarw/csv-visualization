var viewBar = view1Ctrl.directive('viewBar', function() {
  function link(scope, element, attrs) {
    scope.linearScale = false;
    scope.isIncluded = true;
    scope.isCategorized = false;
    scope.categories;
    scope.isEvenlyDistributed = true;
    scope.thresholds;

    scope.$watch('linearScale', function(newVal) {
      scope.$broadcast('change_scale', newVal);
      scope.isCategorized = false;
    });
    scope.$watch('isIncluded', function(newVal) {
      if (newVal==false) {
        scope.isCategorized = false;
      }
    });
    scope.$watch('isCategorized', function(newVal) {
      if (newVal==false) {
        scope.categories = null;
      }
    });
    scope.$watch('categories', function(newVal) {
      if (newVal==null || newVal=='') {
        scope.isEvenlyDistributed = true;
        scope.$broadcast('remove_histogram');
      } else {
        scope.$broadcast('bin_number_changed', newVal);
        scope.isEvenlyDistributed = true;
      }
    });
    scope.$watch('isEvenlyDistributed', function(newVal) {
      if (newVal==false && scope.categories) {
        scope.$broadcast('add_draggable');
      } else if (newVal==true && scope.categories) {
        scope.$broadcast('remove_draggable');
        scope.$broadcast('bin_number_changed', scope.categories);
      } else {
        scope.$broadcast('remove_draggable');
      }
    });
    scope.$watchGroup(
      ['isIncluded', 'isCategorized', 'categories', 'thresholds'],
      function() {
        // aggregateValues();
    });
    scope.$on('retrieve_category_data', function(){
      aggregateValues();
    });

    function aggregateValues() {
      var aggregate = {
        name: scope.column.name,
        dataType: scope.column.dataType,
        totalIDs: scope.column.totalIDs,
        isExcluded: !scope.isIncluded,
        offset: scope.column.offset,
        isCategorized: scope.isCategorized
      }
      if (scope.column.totalIDs <= 100) aggregate.uniqueIDs = scope.column.uniqueIDs;
      if (scope.isCategorized) {
        aggregate.bins = {
          method: 'user_specified_numeric',
          totalBins: scope.categories,
          numericMap: scope.thresholds
        }
      }
      scope.$emit('column_change', aggregate);
    }
  }
  return {
    restrict: 'EA',
    templateUrl: 'view1/viewBar.html',
    scope: {
      column: '=column'
    },
    link: link
  }
});