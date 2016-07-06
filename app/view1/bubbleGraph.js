var bubbleGraph = view1Ctrl.directive('bubbleGraph', ['d3Service', function(d3Service) {
    function group_data(data) {
      var chartData =  Object.keys(data).map(function (key) {
        return {name: key, value: data[key]};
      });
      return {children: chartData};
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
                width: 1000,      height: 600,       margin_top: 20, 
                margin_right: 40, margin_bottom: 30, margin_left: 40
            }

        var selector = '.chart_'+scope.column.name;
        var color = d3.scale.category20c();

        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height);

        // set the width and height based off options given
        var width  = options.width  - options.margin_left - options.margin_right,
            height = options.height - options.margin_top  - options.margin_bottom;

        var bubble = d3.layout.pack()
          .sort(null)
          .size([width, height])
          .padding(3);

        scope.create_bubble_graph = function() {
          var chartData = group_data(scope.column.values);

          // appends data from chartData to svg element
          var node = chart.selectAll(".node")
            .data(bubble.nodes(chartData).filter(function(d) { return !d.children; }))
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          node.append("title")
            .text(function(d) { return d.name + ": " + d.value; });

          node.append("circle")
            .attr("r", function(d) { return d.r; })
            .style("fill", function(d) { return color(d.name); });

          node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.name.substring(0, d.r / 3); });
        }
        scope.$watch('column', function(column) {
          scope.create_bubble_graph();
        });
      });
    }
  };
}])