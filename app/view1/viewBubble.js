var viewBar = view1Ctrl.directive('viewBubble', function() {
  function link(scope, element, attrs) {
    scope.isIncluded = true;
    scope.isCategorized = false;
    scope.categories = 0;
    scope.thresholds;
    scope.tiles = [];
    scope.palette = shuffle(palette('tol-rainbow', 20));
    scope.selectedIndex = -1;
    var paletteIndex = 0;

    scope.$watch('isIncluded', function(newVal) {
      if (newVal==false) {
        scope.isCategorized = false;
      }
    });
    scope.$watch('isCategorized', function(newVal) {
      if (newVal==false) {
        scope.categories = 0;
      }
    });
    scope.$watch('categories', function(newVal, oldVal) {
      // if (newVal==0) {
      //   scope.$broadcast('remove_categories');
      // } else {
        scope.$broadcast('categories_changed', newVal, oldVal);
      // }

      createCategoryBox(newVal, oldVal);
    });

    scope.choose = function(tile, index) {
      console.log(tile, index);
      scope.selectedIndex = index;
      scope.$broadcast('remove_listener');
      scope.$broadcast('add_listener', tile.colour);
    }

    scope.$watchGroup(
      ['isIncluded', 'isCategorized', 'categories', 'thresholds'],
      function() {
        aggregateValues();
    })

    function createCategoryBox(newVal, oldVal) {
      var difference = oldVal - newVal;
      if (difference > 0) {
        scope.tiles.splice(newVal, difference);
        paletteIndex -= difference;
      } else {
        for (var i=0; i < (-difference); i++) {
          var tile = {};
          tile.span = {row:1, col:1};
          tile.colour = '#' + scope.palette[paletteIndex];
          scope.tiles.push(tile);
          paletteIndex++;
        }
      }
    }

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
          method: 'user_specified_categorical',
          totalBins: scope.categories,
          numericMap: scope.thresholds
        }
      }
      scope.$emit('column_change', aggregate);
    }

    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    }
  }
  return {
    restrict: 'EA',
    templateUrl: 'view1/viewBubble.html',
    scope: {
      column: '=column'
    },
    link: link
  }
});