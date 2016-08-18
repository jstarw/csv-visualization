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
      scope.data; // popuplated from bubbleGraph.js
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
        createTiles(newVal, oldVal);
        scope.$broadcast('categories_changed', newVal, oldVal, scope.tiles);
      });
      scope.$watchGroup(
        ['isIncluded', 'isCategorized', 'categories', 'data'],
        function() {
          scope.aggregateValues();
      });

      // validates tile input, and sends signal to bubblegraph
      scope.validate = function(tile, index) {
        // first remove whitespace, then split into array
        var items = tile.categoricalMap.replace(/\s/g, '').split(',');
        // perform some validation on the input
        items = items.filter(function(d) {
          if (d=="") {
            console.log('empty item found, removing it from list...');
            return false;
          } else return true;
        });
        scope.$broadcast('filter_categories', items, index);
      }

      // changes the tile and category name
      scope.changeTileName = function(tile, index) {
        console.log(scope.tiles[index]);
        scope.selectedIndex = -1;
        scope.$broadcast('remove_listener');
        scope.$broadcast('change_category_name', tile, index);
      }

      // selects tile and allows user to click bubbles that belong to the tile
      scope.selectTile = function(tile, index) {
        // when clicking itself, turn off selection
        if (scope.selectedIndex == index) {
          scope.selectedIndex = -1;
          scope.$broadcast('remove_listener');    
        } else {
          scope.selectedIndex = index;
          scope.$broadcast('add_listener', tile);
        }
      }

      // builds object that will be sent in final job object
      scope.aggregateValues = function() {
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
        // saves the aggregated values into the data service 
        data.setPreferencesByColumn(scope.column.name, aggregate);
      }

      // generates the new tiles (which represent the categories)
      function createTiles(newVal, oldVal) {
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

      // turns an array of objects to an object with keys being the category name, and values 
      // being the associated bubbles
      function buildCategoricalMap() {
        var categoricalMap = {};
        scope.data.forEach(function(d) {
          if (categoricalMap[d.category]) {
            categoricalMap[d.category].push(d.name);
          } else {
            categoricalMap[d.category] = [d.name];
          }
        });
        return categoricalMap;
      }

      // shuffles the array randomly in place
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