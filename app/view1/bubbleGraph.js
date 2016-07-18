var bubbleGraph = view1Ctrl.directive('bubbleGraph', ['d3Service', function(d3Service) {
  return {
    restrict: 'EA',
    scope: {
      column: '=column'
    },
    template: '<svg class="chart_{{column.name}} chart" layout></svg>',
    // templateUrl: 'view1/bubbleGraph.html',
    link: function(scope, element, attrs) {
      d3Service.d3().then(function(d3) {

        var options = {
          width: 1000,      height: 1000,       margin_top: 0, 
          margin_right: 40, margin_bottom: 0, margin_left: 40
        }

        // set the width and height based off options given
        var width  = options.width  
            height = options.height ;

        var selector = '.chart_'+scope.column.name;
        var color = d3.scale.category20c();
        var format = d3.format(',d');

        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height)
          // .append('g')
          //   .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

        var charge = function(d) {
          return -Math.pow(d.radius, 2.0) / 4;
        }

        var radiusScale = d3.scale.pow()
          .exponent(0.5)
          .domain([1, d3.max(_.values(scope.column.values))])
          .range([10, 100]);

        // variables related to force chart
        var data = group_data(scope.column.values);
        var damper = 0.2;
        var padding = 4;
        var maxRadius = d3.max(_.pluck(data, 'radius'));
        var force = d3.layout.force().size([width,height])
          .nodes(data)
          .charge(charge)
          .gravity(-0.01)
          .friction(0.9);
        // variable to store the centers of the categories
        var centers = _.uniq(_.pluck(data, 'category')).map(function (d) {
          return {name: d, value: 1, colour: 'D4D4D4'};
        });

        function group_data(data) {
          var chartData =  Object.keys(data).map(function (key) {
            return {
              name: key, 
              value: data[key],
              category: 'testName',
              x: Math.random() * width,
              y: Math.random() * height,
              radius: radiusScale(data[key])
            };
          });
          return chartData;
        }

        function getCenters(vname, size, centers) {
          var map = d3.layout.treemap().size(size).ratio(1/1); 
          map.nodes({children: centers}); 
          return centers;
        }

        function draw(varname) {
          centers = getCenters(varname, [width, height], centers);
          force.on("tick", tick(centers, varname));
          labels(centers);
          force.start();
        }

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

        function tick (centers, varname) {
          var foci = {}; // Making an object here for quick look-up
          for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
          }
          return function (e) { //A
            for (var i = 0; i < data.length; i++) {
              var o = data[i];
              var f = foci[o[varname]];
              if (!f) {
                console.log(f);
              }
              o.y += ((f.y + (f.dy / 2)) - o.y) * damper * e.alpha * 1.1;
              o.x += ((f.x + (f.dx / 2)) - o.x) * damper * e.alpha * 1.1;
            }
            chart.selectAll('circle')//.each(collide(.1)) //B
              .attr("cx", function (d) { return d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)); })
              .attr("cy", function (d) { return d.y = Math.max(d.radius, Math.min(width - d.radius, d.y)); });
          }
        }
        
        function createForceGraph() {
          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return  "<div>Name: " + d.name + "</div>" + 
                      "<div>Total Count: " + d.value + "</div>";
            });

          // data.sort(function (a, b) { return b.value - a.value; });
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
              .on('mouseout', tooltip.hide)

          nodes.transition().duration(1000)
            .attr("r", function (d) { return d.radius; });

          // draw initial 
          draw('category');

        }

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
          console.log(centers);
          draw('category');
        }

        function changeCategoryName(tile, index) {
          centers[index+1].name = tile.name ? tile.name : 'category' + (index+1);
          labels(centers);
        }

        function createBubbleGraph() {
          var chartData = group_data(scope.column.values);

          // appends data from chartData to svg element
          var node = chart.selectAll('.node')
            .data(bubble.nodes(chartData).filter(function(d) { return !d.children; }))
          .enter().append('g')
            .attr('class', 'node')
            .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

          node.append('title')
            .text(function(d) { return d.name + ': ' + format(d.value); });

          node.append('circle')
            .attr('r', function(d) { return d.r; })
            .attr('class', 'circle')
            .style('fill', function(d) { return color(d.name); });

          node.append('text')
            .attr('dy', '.3em')
            .style('text-anchor', 'middle')
            .text(function(d) { return d.name.substring(0, d.r / 3); });
        }

        function getNodes() {
          return $(chart.selectAll('circle')[0]);
        }

        function removeStandardColour() {
          chart.selectAll('circle')
            .style('fill', '#D4D4D4');
        }

        function addStandardColour() {
          chart.selectAll('circle')
            .style('fill', function(d) { return color(d.name); })
            .datum(function(d) {
              d.category = 'testName';
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
                d.category = 'testName';
                return true;
              } else return false;
            })
            .style('fill', '#D4D4D4');
        }

        function addListener(category) {
          removeListener(); // clear all click listeners
          var nodes = getNodes();
          nodes.attr('cursor', 'pointer');
          nodes.on('click', function() {
            var data = d3.select(this).data();
            d3.select(this).style('fill', category.colour);
            data[0].category = category.name;
            data[0].colour = category.colour;
            draw('category');
          });
        }

        function removeListener() {
          var nodes = getNodes();
          nodes.unbind('click').attr('cursor', 'default');
        }

        scope.$watch('column', function() {
          createForceGraph();
        });

        scope.$on('categories_changed', function(event, newVal, oldVal, tiles) {
          var diff = oldVal - newVal;
          if (oldVal == 0) {
            removeStandardColour();
          } else if (newVal == 0) {
            addStandardColour();
          } else if (diff > 0) {
            removeSpecificColours(diff);
          }

          changeCenters(newVal, oldVal, tiles);
        });

        scope.$on('remove_listener', function() {
          removeListener();
        })

        scope.$on('add_listener', function(event, tile) {
          addListener(tile);
        });

        scope.$on('change_category_name', function(event, tile, index) {
          changeCategoryName(tile, index);
        });
      });
    }
  };
}])