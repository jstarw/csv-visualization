view1Ctrl.directive(
  'bubbleGraph', ['d3Service', function(d3Service) {

  return {
    restrict: 'EA',
    scope: true,
    template: '<svg class="chart_{{column.name}}_bubble chart" layout></svg>',
    link: function(scope, element, attrs) {
      d3Service.d3().then(function(d3) {

        scope.$watch('column', function() {
          createForceGraph(); // starts the force graph
        });

        var options = {
          width: 1000,      height: 1000,       margin_top: 0, 
          margin_right: 40, margin_bottom: 0, margin_left: 40
        };

        // variables for svg element
        var width  = options.width,
            height = options.height,
            selector = '.chart_' + scope.column.name + '_bubble',
            color = d3.scale.category20c();

        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height);

        // variables related to force chart
        var radiusScale = d3.scale.pow()
          .exponent(0.5)
          .domain([1, d3.max(_.values(scope.column.values))])
          .range([10, 100]);
        var data = group_data(scope.column.values);
        var damper = 0.2;
        var force = d3.layout.force().size([width,height])
          .nodes(data)
          .charge(function(d) {
            return -Math.pow(d.radius, 2.0) / 3.5;
          })
          .gravity(-0.02);
        // variable to store the centers of the categories
        var centers = _.uniq(_.pluck(data, 'category')).map(function (d) {
          return {name: d, value: 1, colour: 'D4D4D4'};
        });

        // Groups data coming from the columns object into an array of objects. 
        // Each object in the array represents a discrete bubble.
        // The data is then used by the force graph to create the bubbles
        function group_data(data) {
          return Object.keys(data).map(function (key) {
            return {
              name: key, // name of the bubble
              value: data[key], // value of the bubble
              category: 'Not Categorized', // category name
              x: Math.random() * width, // initialize x coordinates to a random position
              y: Math.random() * height, // initialize y coordinates to a random position
              radius: radiusScale(data[key]) // radius of the bubble
            };
          });
        }

        
        // Uses D3 treemap layout to find the location of the categories/centers on the svg.
        // Treemap changes the centers variable in place and adds x and y coordinates
        function getCenters(size, centers) {
          var map = d3.layout.treemap()
            .size(size).ratio(1)
            .sort(null)
            .nodes({children: centers}); 
          return centers;
        }

        // draws the bubbles and centers on the screen, and starts the animation
        function draw(varName) {
          centers = getCenters([width, height], centers);
          force.on("tick", tick(centers, varName));
          labels(centers);
          force.start(); // starts force animation
          scope.$parent.data = data; // update data
          scope.$parent.aggregateValues();
        }

        // starts the force animation without redrawing the bubbles or centers
        function startForce() {
          force.start();
          scope.$parent.data = data; // update data
          scope.$parent.aggregateValues();
        }

        // adds the category labels to the svg
        function labels(centers) {
          chart.selectAll(".label").remove();
          chart.selectAll(".label")
            .data(centers).enter().append("text")
            .attr("class", "label")
            .text(function (d) { return d.name })
            .attr("transform", function (d) {
              return "translate(" + (d.x + (d.dx / 2)) + ", " + (d.y + 20) + ")";
            });
        }

        // specifies the movement of the bubbles at every tick of the animation. 
        // this function is called every time the force animation starts
        function tick (centers, varname) {
          var foci = {}; // Making an object here for quick look-up
          for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
          }
          return function (e) { 
            for (var i = 0; i < data.length; i++) {
              var o = data[i];
              var f = foci[o[varname]];
              if (!f) {
                console.log(f);
              }
              o.y += ((f.y + (f.dy / 2)) - o.y) * damper * e.alpha * 1.1;
              o.x += ((f.x + (f.dx / 2)) - o.x) * damper * e.alpha * 1.1;
            }
            chart.selectAll('circle') // moves the bubbles. Boundaries are also stated here
              .attr("cx", function (d) { return d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)); })
              .attr("cy", function (d) { return d.y = Math.max(d.radius, Math.min(width - d.radius, d.y)); });
          }
        }

        // function initializes the svg and the tooltip function. 
        // only called once at the beginning of the program
        // creates the bubbles and draws the categories on the svg
        function createForceGraph() {
          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return  "<div>Name: " + d.name + "</div>" + 
                      "<div>Total Count: " + d.value + "</div>";
            });

          var nodes = chart.selectAll("circle")
            .data(data);

          nodes.enter().append("circle")
            .attr("class", "node")
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .attr("r", 2)
            .style("fill", function (d) { return color(d.name); })
            .call(tooltip)
              .on('mouseover', tooltip.show)
              .on('mouseout', tooltip.hide);

          nodes.transition().duration(1000)
            .attr("r", function (d) { return d.radius; });

          // draw initial 
          draw('category');
        }

        // called whenever the number of categories changes, redraws the svg
        function changeCenters(newVal, oldVal, tiles) {
          // calculate new centers
          var diff = oldVal-newVal;
          if (diff > 0) { 
            centers.splice(newVal+1, centers.length); 
          } else {
            for (var i=oldVal; i<tiles.length; i++) {
              var n = tiles[i].name ? tiles[i].name : 'category '+ (i+1);
              centers.push({name: n, value: 1, colour: tiles[i].colour});
            }
          }
          //update force layout by redrawing
          draw('category');
        }

        // called whenever the name of a category changes, redraws the svg
        function changeCenterName(tile, index) {
          var oldName = centers[index+1].name;
          var newName = tile.name ? tile.name : 'category' + (index+1);
          centers[index+1].name = newName;
          // update the the circles within the center, so that their data is in sync 
          // with the new category name
          var remainingNodes = getNodes().filter(function(d) { return d.category==oldName; });
          if (remainingNodes.length > 0) {
            remainingNodes.datum(function(d) { 
              d.category = newName;
              return d;
            });
          }
          //update force layout by redrawing
          draw('category'); 
        }

        function getNodes() {
          return chart.selectAll('circle');
        }

        function removeStandardColour() {
          chart.selectAll('circle')
            .style('fill', '#D4D4D4');
        }

        function addStandardColour() {
          chart.selectAll('circle')
            .style('fill', function(d) { return color(d.name); })
            .datum(function(d) {
              d.category = 'Not Categorized';
              return d;
            });
        }

        function removeSpecificColours(numColours) {
          var coloursToRemove = scope.$parent.palette.slice(
            scope.$parent.paletteIndex, 
            scope.$parent.paletteIndex+numColours);

          chart.selectAll('circle')
            .filter(function(d) {
              if (coloursToRemove.indexOf(d.colour) > -1) {
                // reset data to original state
                d.colour = undefined; 
                d.category = 'Not Categorized';
                return true;
              } else return false;
            })
            .style('fill', '#D4D4D4');
        }

        function addListener(category) {
          removeListener(); // clear all click listeners
          var nodes = $(getNodes()[0]);
          nodes.attr('cursor', 'pointer');
          nodes.on('click', function() {
            d3.select(this)
              .style('fill', category.colour)
              .datum(function(d) { // must change the category and colour
                d.category = category.name;
                d.colour = category.colour;
                return d;
              });
            startForce();
          });
        }

        function removeListener() {
          var nodes = $(getNodes()[0]);
          nodes.unbind('click').attr('cursor', 'default');
        }

        function filterSpecificCategory(items, index) {
          var center = centers[index+1];
          // get all nodes that match every rule in the items
          var remainingNodes = getNodes()
            .filter(function(d) { 
              var match = false;
              items.forEach(function(item) {
                // if name matches with the item, include it in the list
                if (matchRule(d.name, item)) {
                  match = true;
                }
              });
              return match;
            });
          // change the category and colour of the filtered bubbles
          if (remainingNodes.length>0) {
            remainingNodes.datum(function(d) { 
              d.category = center.name;
              d.colour = center.colour;
              return d;
            }).style('fill', function() { return center.colour; });
          }
          startForce();
        }

        /* 
        matches strings to a rule, including wildcards (*)
          "a*b" => everything that starts with "a" and ends with "b"
          "a*" => everything that starts with "a"
          "*b" => everything that ends with "b"
          "*a*" => everything that has a "a" in it
          "*a*b*"=> everything that has a "a" in it, followed by anything, 
            followed by a "b", followed by anything
        */
        function matchRule(str, rule) {
          return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
        }

        // called when the number of categories changes
        scope.$on('categories_changed', function(event, newVal, oldVal, tiles) {
          var diff = oldVal - newVal;
          if (oldVal == 0) { // not categorized to categorized
            removeStandardColour();
          } else if (newVal == 0) { // categorized to not categorized
            addStandardColour();
          } else if (diff > 0) { // when number of categories decreases
            removeSpecificColours(diff);
          }

          changeCenters(newVal, oldVal, tiles);
        });

        // removes click listener for bubbles
        scope.$on('remove_listener', function() {
          removeListener();
        });

        // adds click listener to bubbles, allows them to move to specific category
        scope.$on('add_listener', function(event, tile) {
          addListener(tile);
        });

        // called when user changes name in the input field
        scope.$on('change_category_name', function(event, tile, index) {
          changeCenterName(tile, index);
        });

        // filters bubble that belong to category based on rules
        scope.$on('filter_categories', function(event, items, index) {
          filterSpecificCategory(items, index);
        });
      });
    }
  };
}]);