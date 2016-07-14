var bubbleGraph = view1Ctrl.directive('bubbleGraph', ['d3Service', function(d3Service) {
    function group_data(data) {
      var chartData =  Object.keys(data).map(function (key) {
        return {name: key, value: data[key]};
      });
      return {children: chartData};
    }

    function group_data2(data) {
      var chartData =  Object.keys(data).map(function (key) {
        return {
          name: key, 
          value: data[key],
          category: 'testName'
        };
      });
      return chartData;
    }
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
        var width  = options.width  - options.margin_left - options.margin_right,
            height = options.height - options.margin_top  - options.margin_bottom;

        var selector = '.chart_'+scope.column.name;
        var color = d3.scale.category20c();
        var format = d3.format(',d');

        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height)
          .append('g')
            .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

        var bubble = d3.layout.pack()
          .sort(null)
          .size([width, height])
          .padding(3);
        
        scope.createForceGraph = function() {

          var data = group_data2(scope.column.values);
          var damper = 0.101;
          var padding = 4;
          var maxRadius = d3.max(_.pluck(data, 'radius'));

          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return  "<div>Name: " + d.name + "</div>" + 
                      "<div>Total Count: " + d.value + "</div>";
            });

          var getCenters = function (vname, size) {
            var centers, map;
            centers = _.uniq(_.pluck(data, vname)).map(function (d) {
              return {name: d, value: 1};
            });

            map = d3.layout.pack().size(size);
            map.nodes({children: centers});

            return centers;
          };

          bubble.nodes({children:data}).filter(function(d) { return !d.children; });
          data.forEach(function(d) {
            d.x = Math.random() * width;
            d.y = Math.random() * height;
            d.radius = d.r;
            delete d.r;
            delete d.depth;
            delete d.parent;
          })
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
            .attr("r", function (d) { return d.radius; })

          var force = d3.layout.force()
            .size([width,height])
            .charge(function(d) {
              return -Math.pow(d.radius, 2.0) / 8;
            })
            .gravity(-0.01)
            .friction(0.9);

          draw('category');

          $( ".btn" ).click(function() {
            draw(this.id);
          });

          function draw (varname) {
            var centers = getCenters(varname, [width, height]);
            force.on("tick", tick(centers, varname));
            labels(centers)
            force.start();
          }

          function tick (centers, varname) {
            var foci = {};
            for (var i = 0; i < centers.length; i++) {
              foci[centers[i].name] = centers[i];
            }
            return function (e) {
              for (var i = 0; i < data.length; i++) {
                var o = data[i];
                var f = foci[o[varname]];
                o.y += (f.y - o.y) * damper * e.alpha;
                o.x += (f.x - o.x) * damper * e.alpha;
              }
              nodes.each(collide(0.5))
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
            }
          }

          function labels (centers) {
            chart.selectAll(".label").remove();

            chart.selectAll(".label")
            .data(centers).enter().append("text")
            .attr("class", "label")
            .text(function (d) { return d.name })
            .attr("transform", function (d) {
              return "translate(" + (d.x - ((d.name.length)*3)) + ", " + (d.y - d.r) + ")";
            });
          }

          function collide(alpha) {
            var quadtree = d3.geom.quadtree(data);
            return function(d) {
              var r = d.radius + maxRadius + padding,
                  nx1 = d.x - r,
                  nx2 = d.x + r,
                  ny1 = d.y - r,
                  ny2 = d.y + r;
              quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                  var x = d.x - quad.point.x,
                      y = d.y - quad.point.y,
                      l = Math.sqrt(x * x + y * y),
                      r = d.radius + quad.point.radius + padding;
                  if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                  }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
              });
            };
          }
        }

        scope.createBubbleGraph = function() {
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
            .style('fill', function(d) { return color(d.name); });
        }

        function removeSpecificColours(numColours) {
          var coloursToRemove = scope.$parent.palette.slice(
            scope.$parent.paletteIndex, 
            scope.$parent.paletteIndex+numColours);

          chart.selectAll('circle')
            .filter(function(d) {
              if (coloursToRemove.indexOf(d.colour) > -1) {
                d.colour = undefined; // reset data to original state
                return true;
              } else return false;
            })
            .style('fill', '#D4D4D4');
        }

        function addListener(colour) {
          removeListener(); // clear all click listeners
          var nodes = getNodes();
          nodes.attr('cursor', 'pointer');
          nodes.parent().on('click', function() {
            var circle = d3.select(this).select('circle');
            var data = circle.data();
            circle.style('fill', colour);
            // $(this).children('circle').css('fill', colour);
            data[0].colour = colour;
          });
        }

        function removeListener() {
          var nodes = getNodes();
          nodes.parent().unbind('click');
        }

        scope.$watch('column', function() {
          scope.createForceGraph();
        });

        scope.$on('categories_changed', function(event, newVal, oldVal) {
          var diff = oldVal - newVal;
          console.log(newVal, oldVal);
          if (oldVal == 0) {
            removeStandardColour();
          } else if (newVal == 0) {
            addStandardColour();
          } else if (diff > 0) {
            removeSpecificColours(diff);
          }
        });

        scope.$on('remove_listener', function() {
          removeListener();
        })

        scope.$on('add_listener', function(event, colour) {
          addListener(colour);
        });
      });
    }
  };
}])