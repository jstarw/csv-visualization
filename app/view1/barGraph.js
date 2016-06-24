var barGraph = view1Ctrl.directive('barGraph', ['d3Service', function(d3Service) {
  function groupData(res) {
    var obj = {};
    var chartData = [];
    for (var i=0; i<res.length; i++) {
      if (!obj[res[i]]) obj[res[i]] = 1;
      else obj[res[i]]++;
    }
    //pushes objects inside obj into array
    var chartData = Object.keys(obj).map(function (key) {
      return {name:key, value:obj[key]}
    });

    return chartData;
  }
  function histogram(chartData, selector, options, bins) {
    // d3.select(selector).remove();
    var formatCount = d3.format(",.0f");
    var width  = options.width  - options.margin_left - options.margin_right,
        height = options.height - options.margin_top  - options.margin_bottom;
    // var data = d3.range(500).map(d3.random.normal(4.0, 1.0));
    var chart = d3.select(selector)
      .attr('width', options.width)
      .attr('height', options.height)
      .append('g')
        .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

    var bins = d3.layout.histogram()
      .bins(bins)
      (chartData);

    console.log(bins);

    var x = d3.scale.linear()
      .range([0, width])
      .domain([0, d3.max(chartData, function(d) { return d; })]);

    var y = d3.scale.linear()
      .domain([0, d3.max(bins, function(d) { return d.length; })])
      .range([height, 0]);

    // create x and y axis 
    var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom');

    var bar = chart.selectAll(".bar")
      .data(bins)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.length) + ")"; });

    bar.append("rect")
      .attr("x", 1)
      .attr("width", x(bins[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.length); });

    bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", x(bins[0].dx / 2))
      .attr("text-anchor", "middle")
      .text(function(d) { return formatCount(d.length); });

    // add x axis
    // chart.append('g')
    //   .attr('class', 'x axis')
    //   .attr('transform', 'translate(0,' + height + ')')
    //   .call(xAxis)
  }
  return {
    restrict: 'EA',
    template: '<svg class="chart_{{column.name}} chart"></svg>',
    scope: {
      column: '=column'
    },
    link: function(scope, element, attrs, columnData) {
      d3Service.d3().then(function(d3) {

        var options = {
                width: 1000,      height: 600,       margin_top: 20, 
                margin_right: 20, margin_bottom: 30, margin_left: 40
            }
        var selector = '.chart_'+scope.column.name;
        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height)
          .append('g')
            .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

        var chartData = groupData(scope.column.values);

        scope.create_bar_graph = function(chartData, options) {
          // set the width and height based off options given
          var width  = options.width  - options.margin_left - options.margin_right,
            height = options.height - options.margin_top  - options.margin_bottom;

          // create linear scale
          var x = d3.scale.linear()
            .range([0, width])
            .domain([0, chartData.length]);

          var y = d3.scale.linear()
            .range([height, 0])
            .domain([0, d3.max(chartData, function(d) { return d.value; })]);

          // create x and y axis 
          var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');

          var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(10);

          var barWidth = width / chartData.length;

          // appends data from chartData to svg element
          var bar = chart.selectAll('g')
            .data(chartData)
              .enter().append('rect')
            .attr('y', function(d) { return y(d.value); })
            .attr('x', function(d, i) { return i * barWidth; })
            .attr('height', function(d) { 
              if (height - y(d.value<0)) return 0; // check for negative numbers
              else return height - y(d.value); 
            })
            .attr('width', barWidth - 1)
            .attr('title', function(d) { return 'Value: ' + d.value; });

          // add y axis
          chart.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 10)
            .style('text-anchor', 'end')
            .text('value Value');

          // add x axis
          chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .append('text')
            .attr('x', 10)
            .attr('y', 30)
            .text('Operation Field');

          // function to convert from string to number
          function type(d) {
            d.value = +d.value; 
            return d;
          }
        }

        scope.histogram = function(chartData, bins) {
          var width  = chart.attr('width');
          var height = chart.attr('height');
          var lines = bins - 1;

          // remove previous lines 
          chart.selectAll('.g-bin-line').remove();
          chart.append('g').classed('g-bin-line', true)
            .append('line')
            .attr('x1', 200)
            .attr('x2', 200)
            .attr('y1', 0)
            .attr('y2', 600)
            .classed('bin-line', true);

          var hist = d3.layout.histogram()
            .bins(bins)
            (chartData);
          console.log(hist);

          var y = d3.scale.linear()
            .domain([0, d3.max(bins, function(d) { return d.length; })])
            .range([height, 0]);
        }

        scope.$watch('column', function(column) {
          scope.chartData = groupData(column.values);
          console.log(chartData);
          // histogram(column.values, '.chart_'+column.name, options, 10);
          scope.create_bar_graph(chartData, options);
        });

        scope.$on('bin_number_changed', function(event, value) {
          console.log(event, value);
          scope.histogram(scope.column.values, value);
        });
      });
    }
  };
}])