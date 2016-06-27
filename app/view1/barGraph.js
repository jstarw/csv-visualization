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

  return {
    restrict: 'EA',
    template: '<svg class="chart_{{column.name}} chart"></svg>',
    scope: {
      column: '=column'
    },
    link: function(scope, element, attrs) {
      d3Service.d3().then(function(d3) {

        var options = {
                width: 1000,      height: 600,       margin_top: 20, 
                margin_right: 40, margin_bottom: 30, margin_left: 40
            }

        var selector = '.chart_'+scope.column.name;
        var chart = d3.select(selector)
          .attr('width', options.width)
          .attr('height', options.height)
          .append('g')
            .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

        var chartData = groupData(scope.column.values);

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

        scope.create_bar_graph = function(chartData, options) {
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
            .attr('height', function(d) { return height - y(d.value); })
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

        scope.histogram = function(chartData, groupedData, bins) {
          scope.removeHistogram();
          var binSize = groupedData.length / bins;
          var barWidth = width / groupedData.length;
          var keys = groupedData.map(function(x) {return +x.name}).sort(function(a, b){return a-b});
          var reverseKeys = {};
          for (var i=0; i<keys.length; i++) {
            if (i==keys.length-1) reverseKeys[keys[i]] = i+1; // must include last element
            else reverseKeys[keys[i]] = i;
          }
          console.log(keys, reverseKeys);
          var binThresholds = [];
          for (var i=0; i<bins; i++) {
            binThresholds.push(keys[Math.round(i*binSize)]);
          }
          binThresholds.push(keys[keys.length-1]);
          console.log(binThresholds);

          var hist = d3.layout.histogram()
            .bins(binThresholds)
            (chartData);
          console.log(hist);
          console.log(x);

          var y1 = d3.scale.linear()
            .domain([0, d3.max(hist, function(d) { return d.y; })])
            .range([height, 0]);

          var bars = chart.selectAll('rect')
            .data(hist, function(d,i) {return 'hist-'+d.y+'-'+i;}).enter()
            .insert('g', ':first-child')
              .attr('class', 'bin-bar')
              .append('rect')
              .attr('y', function(d) { return y1(d.y); })
              .attr('x', function(d, i) { 
                return barWidth*reverseKeys[d.x];
              })
              .attr('width', function(d, i) {
                return barWidth*(reverseKeys[d.x + d.dx] - reverseKeys[d.x])-1;
              })
              .attr('height', function(d) {return height - y1(d.y)});

          var yAxis = d3.svg.axis()
            .scale(y1)
            .orient('right')
            .ticks(10);

          // add y axis
          chart.append('g')
            .attr('class', 'y axis right')
            .attr("transform", "translate(" + width + " ,0)") 
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 10)
            .style('text-anchor', 'end')
            .text('frequecy');
        }

        scope.removeHistogram = function() {
          chart.selectAll('.bin-bar').remove();
          chart.selectAll('.y.axis.right').remove();
        }

        scope.addDraggable = function() {
          var dragbarw = 10;

          // var drag = d3.behavior.drag()
          //   .origin(Object)
          //   .on("drag", dragmove);

          // var dragright = d3.behavior.drag()
          //   .origin(Object)
          //   .on("drag", rdragresize);

          // var dragleft = d3.behavior.drag()
          //   .origin(Object)
          //   .on("drag", ldragresize);

          // chart.selectAll('.bin-bar').call(drag);

          var dragbarleft = chart.selectAll('.bin-bar')
            .append("rect")
            .attr("x", function(d) { console.log(d);return d.x - (dragbarw/2); })
            .attr("y", function(d) { return d.y + (dragbarw/2); })
            .attr("height", 200)
            .attr("class", "dragleft")
            .attr("width", dragbarw)
            .attr("fill", "lightblue")
            .attr("fill-opacity", .5)
            .attr("cursor", "ew-resize");
            // .call(dragleft);
        }

        scope.$watch('column', function(column) {
          scope.chartData = groupData(column.values);
          // console.log(chartData);
          // histogram(column.values, '.chart_'+column.name, options, 10);
          scope.create_bar_graph(chartData, options);
        });

        scope.$on('bin_number_changed', function(event, value) {
          scope.histogram(scope.column.values, chartData, value);
        });

        scope.$on('remove_histogram', function(event) {
          scope.removeHistogram();
        });

        scope.$on('add_draggable', function(event) {
          scope.addDraggable();
        });
      });
    }
  };
}])