var viewBar = view1Ctrl.directive('viewBubble', ['columnDataService', function(data) {
  
  return {
    restrict: 'EA',
    templateUrl: 'view1/viewBubble.html',
    scope: {
      column: '=column'
    },
    link: function (scope, element, attrs) {
      scope.isIncluded = true;
      scope.isCategorized = false;
      scope.categories = 0;
      // scope.data;
      scope.tiles = [];
      scope.palette = shuffle(palette('tol-rainbow', 20));
      scope.paletteIndex = 0; // to keep track of the current number of colours
      scope.selectedIndex = -1; // to keep track of which category is selected
      scope.regexp = /(\d+)(,\s*\d+)*/;

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
        scope.selectedIndex = -1;
        scope.$broadcast('remove_listener');
        createCategoryBox(newVal, oldVal);
        scope.$broadcast('categories_changed', newVal, oldVal, scope.tiles);
      });

      scope.validate = function(tile, index) {
        // first remove whitespace, then split into array
        var items = tile.categoricalMap.replace(/\s/g, '').split(',');
        console.log(items);
        // perform some validation on the input
        items = items.filter(function(d) {
          if (d=="") {
            console.log('empty item found, removing it from list...');
            return false;
          } else return true;
        });
        scope.$broadcast('filter_categories', items, index);
      }

      scope.change = function(tile, index) {
        console.log(scope.tiles[index]);
        scope.selectedIndex = -1;
        scope.$broadcast('remove_listener');
        scope.$broadcast('change_category_name', tile, index);
      }

      scope.choose = function(tile, index) {
        // when clicking itself, turn off selection
        if (scope.selectedIndex == index) {
          scope.selectedIndex = -1;
          scope.$broadcast('remove_listener');    
        } else {
          scope.selectedIndex = index;
          scope.$broadcast('add_listener', tile);
        }
      }

      // scope.$watch('data', function(newVal) { 
      //   console.log(data.columnData);
      // });

      scope.$on('retrieve_category_data', function() {
        aggregateValues();
      });

      scope.$watchGroup(
        ['isIncluded', 'isCategorized', 'categories', 'data'],
        function() {
          // aggregateValues();
      });

      function createCategoryBox(newVal, oldVal) {
        var difference = oldVal - newVal;
        if (difference > 0) {
          scope.tiles.splice(newVal, difference);
          scope.paletteIndex -= difference;
        } else {
          for (var i=0; i < (-difference); i++) {
            var tile = {
              span: {row:1, col:1},
              colour: scope.palette[scope.paletteIndex],
              name: 'category ' + (scope.paletteIndex+1),
              categoricalMap: ''
            };
            scope.tiles.push(tile);
            scope.paletteIndex++;
          }
        }
      }

      function buildCategoricalMap() {
        var categoricalMap = {};
        scope.data.forEach(function(d) {
          if (categoricalMap[d.category]) {
            categoricalMap[d.category].push(d.name);
          } else {
            categoricalMap[d.category] = [d.name];
          }
        });
        console.log(categoricalMap);
        return categoricalMap;
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
            categoricalMap: buildCategoricalMap()
          }
        }
        scope.$emit('column_change', aggregate);
        data.setPreferencesByColumn(scope.column.name, aggregate);
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
  }
}]);