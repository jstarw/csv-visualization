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
    scope: {
      column: '=column'
    },
    template: '<svg class="chart_{{column.name}} chart" layout></svg><svg class="chart_{{column.name}}_histogram chart" layout></svg>',
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

        var histogramChart = d3.select(selectorHist)
          .attr('width', 0)
          .attr('height', 0)
          .append('g')
            .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');;

        var chartData = groupData(scope.column.values);
        var keys = chartData.map(function(x) {return +x.name}).sort(function(a, b){return a-b});
        var reverseKeys = {};
        for (var i=0; i<keys.length; i++) {
          if (i==keys.length-1) reverseKeys[keys[i]] = i+1; // must include last element
          else reverseKeys[keys[i]] = i;
        }

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

        var barWidth = width / chartData.length;

        scope.create_bar_graph = function(chartData, options) {
          // create x and y axis 
          var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');

          var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(10);

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

        scope.createHistogramEvenly = function(bins) {
          var binSize = chartData.length / bins;
          var binThresholds = [];
          for (var i=0; i<bins; i++) {
            binThresholds.push(keys[Math.round(i*binSize)]  );
          }
          binThresholds.push(keys[keys.length-1]);

          scope.createHistogram(scope.column.values, binThresholds);
        }

        scope.createHistogram = function(values, binThresholds) {
          scope.removeHistogram();
          var hist = d3.layout.histogram()
            .bins(binThresholds)
            (values);
          console.log(hist);

          var y1 = d3.scale.linear()
            .domain([0, d3.max(hist, function(d) { return d.y; })])
            .range([height, 0]);

          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return  "<div>Range: " + d.range + "</div>" + 
                      "<div>Total Count: " + d.freq + "</div>";
            });

          var histData = hist.map(function(d) {
            return {
              x: barWidth*reverseKeys[d.x],
              y: y1(d.y),
              width: barWidth*(reverseKeys[d.x + d.dx] - reverseKeys[d.x])-1,
              height: height - y1(d.y),
              freq: d.y,
              range:[d.x,d.x+d.dx]
            }
          });
          console.log(histData);

          d3.select(selectorHist)
            .attr('width', options.width)
            .attr('height', options.height);

          var bars = histogramChart.selectAll('rect')
            .data(histData).enter()
            .insert('g', ':first-child')
              .attr('class', 'bin-bar')
              .append('rect')
              .attr('y', height)
              .attr('x', function(d) { return d.x; })
              .attr('width', function(d) { return d.width; })
              .attr('height', 0)
              .call(tooltip)
              .on('mouseover', tooltip.show)
              .on('mouseout', tooltip.hide)
              .transition()
                .duration(1000)
                .attr('y', function (d) { return d.y; })
                .attr('height', function(d) { return d.height; })

          var yAxis = d3.svg.axis()
            .scale(y1)
            .orient('left')
            .ticks(10);

          var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .ticks(histData.length)

          // add y axis
          histogramChart.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 10)
            .style('text-anchor', 'end')
            .text('value Value');

          histogramChart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .append('text')
        }

        scope.removeHistogram = function() {
          histogramChart.selectAll('.bin-bar').remove();
          histogramChart.selectAll('.line').remove();
          histogramChart.selectAll('.y.axis').remove();
          histogramChart.selectAll('.x.axis').remove();
          d3.select(selectorHist)
            .attr('width', 0)
            .attr('height', 0);
        }

        scope.addDraggable = function() {
          var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragMove)
            .on("dragend", updateHistogram);
          var data = histogramChart.selectAll('.bin-bar').data();
          data = data.slice(0,data.length-1); //remove first elem so extra line doesnt appear
          var dragLineGroup = chart.append("g")
            .attr("class", "bin-limits")
            .selectAll("line").data(data).enter()
            .append("g");
          // blue line
          dragLineGroup.append("line")
            .attr("class", "line")
            .attr("y1", 0)
            .attr("y2", height)
            .attr("x1", function(d) { return d.x })
            .attr("x2", function(d) { return d.x })
            .attr("cursor", "ew-resize");
          // transparent line, makes it easier to click 
          dragLineGroup.append("line")
            .attr("class", "drag")
            .style("stroke-width", barWidth)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("x1", function(d) { return d.x })
            .attr("x2", function(d) { return d.x })
            .attr("cursor", "ew-resize")
            .call(drag);

          function leftBound(elem) {
            var prevElem = $(elem).parent().next();
            var d = d3.selectAll(prevElem).data()[0];
            return d ? d.x + barWidth : barWidth;
          }

          function rightBound(elem) {
            var prevElem = $(elem).parent().prev();
            var d = d3.selectAll(prevElem).data()[0];
            return d ? d.x - barWidth : width - barWidth;
          }

          function calculateBound(d, elem) {
            var positionSnap = Math.round(d3.event.x/barWidth)*barWidth;
            return Math.max(leftBound(elem), Math.min(rightBound(elem), positionSnap));
          }

          function dragMove(d) {
            var oldx = d.x; 
            d.x = calculateBound(d, this);
            d.width = d.width + (oldx - d.x);
            var xdiff = d.x - oldx;
            d3.select(this)
              .attr("x1", d.x)
              .attr("x2", d.x);
            d3.select(this.previousSibling)
              .attr("x1", d.x)
              .attr("x2", d.x);
          }

          function updateHistogram() {
            var data = chart.selectAll('.bin-limits .drag').data();
            var binThresholds = [keys[0]];
            data.forEach(function(d) {
              // reverse mapping compared to building histogram
              binThresholds.push(keys[Math.round(x.invert(d.x))]);
            });
            binThresholds.push(keys[keys.length-1]);
            var binThresholdsSorted = binThresholds.sort(function(a, b){return a-b});
            console.log(binThresholds);
            scope.createHistogram(scope.column.values, binThresholdsSorted);
          }
        }

        scope.removeDraggable = function() {
          chart.selectAll('.bin-limits').remove();
        }

        scope.$watch('column', function(column) {
          scope.create_bar_graph(chartData, options);
        });

        scope.$on('bin_number_changed', function(event, value) {
          scope.createHistogramEvenly(value);
        });

        scope.$on('remove_histogram', function(event) {
          scope.removeHistogram();
        });

        scope.$on('add_draggable', function(event) {
          scope.addDraggable();
        });

        scope.$on('remove_draggable', function(event) {
          scope.removeDraggable();
        });
      });
    }
  };
}])