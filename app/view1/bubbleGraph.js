var barGraph = view1Ctrl.directive('barGraph', ['d3Service', function(d3Service) {
  return {
    restrict: 'EA',
    scope: {
      column: '=column'
    },
    template: '<svg class="chart_{{column.name}} chart" layout></svg>',
    // templateUrl: 'view1/barGraph.html',
    link: function(scope, element, attrs) {
      d3Service.d3().then(function(d3) {

        var options = {
                width: 1000,      height: 400,       margin_top: 20, 
                margin_right: 40, margin_bottom: 30, margin_left: 40
            }

        var selector = '.chart_'+scope.column.name;
        var selectorHist = selector + '_histogram';

        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height)
          .append('g')
            .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

        // set the width and height based off options given
        var width  = options.width  - options.margin_left - options.margin_right,
            height = options.height - options.margin_top  - options.margin_bottom;

        var bubble = d3.layout.pack()
          .sort(null)
          .size([width, height])
          .padding(1.5);

        scope.create_bubble_graph = function(chartData, options) {

          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<div>Name: " + d.name + "</div><div>Value: " + d.value + "</div>";
            });
          // appends data from chartData to svg element
          var bar = chart.selectAll('g')
            .data(chartData)
              .enter().append('rect')
            .attr('y', function(d) { return y(d.value); })
            .attr('x', function(d, i) { return i * barWidth; })
            .attr('height', function(d) { return height - y(d.value); })
            .attr('width', barWidth - 1)
            .attr('title', function(d) { return 'Value: ' + d.value; })
            .call(tooltip)
            .on('mouseover', tooltip.show)
            .on('mouseout', tooltip.hide);

          // function to convert from string to number
          function type(d) {
            d.value = +d.value; 
            return d;
          }
        }
        scope.$on('bin_number_changed', function(event, value) {
          scope.createHistogramEvenly(value);
        });
      });
    }
  };
}])