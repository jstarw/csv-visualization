Array.prototype.last = function() {
  return this[this.length - 1];
};

var barGraph = view1Ctrl.directive('barGraph', ['d3Service', function(d3Service) {
  function groupData(histogram, binRange, numBins) {
    var binSize = Math.round(histogram.length/numBins);
    var chartData = [];
    var counter = 0;
    var zeroCounter = 0;
    for (var i=0; i<histogram.length; i++) {
      if (i==0) {
        counter += histogram[i];
      } else if (i%binSize==0 && counter==0) {
        zeroCounter++;
      } else if (i%binSize==0) {
        chartData.push({
          name: binRange[i-(zeroCounter+1)*binSize]+'-'+binRange[i], 
          value: counter,
          x: binRange[i-(zeroCounter+1)*binSize],
          dx: binRange[i]-binRange[i-(zeroCounter+1)*binSize]
        });
        counter = zeroCounter = 0;
      } else if (i==histogram.length-1) {
        counter += histogram[i];
        chartData.push({
          name: binRange[i-(zeroCounter+1)*binSize]+'-'+binRange[i+1], 
          value: counter,
          x: binRange[i-(zeroCounter+1)*binSize],
          dx: binRange[i+1]-binRange[i-(zeroCounter+1)*binSize]
        });
      } else {
        counter += histogram[i];
      }
    }
    return chartData;
  }

  function groupDataLinear(histogram, binRange) {
    var chartData = [];
    for (var i=0; i<histogram.length; i++) {
      chartData.push({
        name: binRange[i] + '-' + binRange[i+1],
        value: histogram[i],
        x: binRange[i],
        dx: binRange[i+1]-binRange[i]
      });
    }
    return chartData;
  }

  return {
    restrict: 'EA',
    // scope: {
    //   column: '=column'
    // },
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
            .attr('transform', 'translate(' + options.margin_left + ',' + options.margin_top + ')');

        var chartData = groupData(scope.column.hist, scope.column.binRange, 100);
        var chartDataLinear = groupDataLinear(scope.column.histLinear, scope.column.binRangeLinear);
        var threshold = chartData.map(function(d) { return d.x; });
        threshold.push(scope.column.binRange.last()); // add last item to threshold

        // set the width and height based off options given
        var width  = options.width  - options.margin_left - options.margin_right,
            height = options.height - options.margin_top  - options.margin_bottom;

        // create linear scale
        var xLinear = d3.scale.linear()
          .range([0, width])
          .domain([scope.column.binRangeLinear[0], scope.column.binRangeLinear.last()]);

        var xQuantile = d3.scale.quantile()
          .domain(threshold)
          .range(d3.range(0,width+1,width/chartData.length));

        var reverseQuantile = {};
        xQuantile.range().forEach(function (x, i) {
          var pair = xQuantile.invertExtent(x).toString();
          reverseQuantile[pair] = xQuantile.domain()[i];
        });

        var currentData; // value to store either chartData or chartDataLinear
        var currentX;
        var currentXAxis; // value to store either xLinear or xOrdinal
        var currentThresholds; // value to store the range of bins

        scope.changeScale = function(isLinear) {
          switch(isLinear) {
            case true:
              currentData = chartDataLinear;
              currentX = xLinear;
              currentXAxis = d3.svg.axis()
                .scale(xLinear)
                .ticks(10)
                .tickFormat(d3.format(",.1f"))
                .orient('bottom');
              break;
            case false:
              currentData = chartData;
              currentX = xQuantile;
              currentXAxis = d3.svg.axis()
                .scale(xQuantile)
                .tickValues(xQuantile.domain().filter(function(d, i) { return !(i % 10); }))
                .tickFormat(d3.format(",.1f"))
                .orient('bottom');
              break;
          }
        }

        scope.removeBarGraph = function() {
          chart.selectAll('rect').remove();
          chart.selectAll('.y.axis').remove();
          chart.selectAll('.x.axis').remove();
        }

        scope.createBarGraph = function(isLinear) {
          var y = d3.scale.linear()
            .range([height, 0])
            .domain([0, d3.max(currentData, function(d) { return d.value; })]);

          var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(10);

          var barWidth = width / currentData.length;

          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<div>Name: " + d.name + "</div><div>Value: " + d.value + "</div>";
            });
          // appends data from chartData to svg element
          scope.removeBarGraph();
          scope.removeDraggable();

          var bar = chart.selectAll('g')
            .data(currentData)
              .enter().append('rect')
            .attr('y', height)
            .attr('x', function(d, i) { return i * barWidth; })
            .attr('height', 0)
            .attr('width', barWidth - 1)
            .attr('title', function(d) { return 'Value: ' + d.value; })
            .call(tooltip)
            .on('mouseover', tooltip.show)
            .on('mouseout', tooltip.hide)
            .transition()
              .duration(1000)
              .attr('y', function(d) { return y(d.value); })
              .attr('height', function(d) { return height - y(d.value); });

          // add y axis
          chart.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 10)
            .style('text-anchor', 'end')
            .text('Frequency');

          // add x axis
          chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(currentXAxis)
            .append('text')
            .attr('x', 10)
            .attr('y', 30)
            .text('Values in column '+scope.column.name);
        }

        scope.createHistogramFromRange = function(range) {
          var histogramData = [];
          var counter = 0;
          var previous = currentData[0].x;
          for (var i=0, j=0; i<currentData.length; i++) {
            if (i==0) {
              counter += currentData[i].value;
              j++;
            } else if (range[j] == currentData[i].x) {
              histogramData.push({
                name: range[j-1] + '-' + range[j],
                value: counter,
                x: currentX(range[j-1]),
                dx: currentX(currentData[i].x)-currentX(range[j-1])
              });
              j++;
              counter = currentData[i].value;
              previous = currentData[i].x;
            } else if (i == currentData.length-1) { // need to add last element in array
              counter += currentData[i].value;
              histogramData.push({
                name: range[j-1] + '-' + range[j],
                value: counter,
                x: currentX(range[j-1]),
                dx: currentX(currentData[i].x + currentData[i].dx)-currentX(range[j-1])
              });
            } else {
              counter += currentData[i].value;
            }
          }
          // add in last bin if not accounted for
          if (range[j]) {
            counter = currentData.last().value;
            histogramData.push({
              name: range[j-1] + '-' + range[j],
              value: counter,
              x: currentX(range[j-1]),
              dx: currentX(currentData.last().x + currentData.last().dx)-currentX(range[j-1])
            });
          }

          scope.$parent.thresholds = range; // update thresholds in parent scope
          scope.safeRefresh(scope.$parent);
          scope.createHistogram(histogramData);
        }

        scope.safeRefresh = function(sc) {
          if (sc.$root.$$phase != '$apply' && sc.$root.$$phase != '$digest') sc.$apply();
        }

        scope.createHistogramEvenly = function(bins) {
          var binSize = currentData.length / bins;
          var binCounter = binSize;
          var range = [currentData[0].x];
          for (var i=1; i<currentData.length; i++) {
            if (i>=binCounter) {
              range.push(currentData[i].x);
              binCounter += binSize;
            }
          }
          range.push(currentX.domain().last()); // include right bound
          scope.createHistogramFromRange(range);
        }

        scope.createHistogram = function(binThresholds) {
          scope.removeHistogram();

          var y1 = d3.scale.linear()
            .domain([0, d3.max(binThresholds, function(d) { return d.value; })])
            .range([height, 0]);

          var tooltip = d3.tip().attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return  "<div>Range: " + d.name + "</div>" + 
                      "<div>Total Count: " + d.value + "</div>";
            });

          var barWidth = width / currentData.length;

          d3.select(selectorHist)
            .attr('width', options.width)
            .attr('height', options.height);

          var bars = histogramChart.selectAll('rect')
            .data(binThresholds).enter()
            .insert('g', ':first-child')
              .attr('class', 'bin-bar')
              .append('rect')
              .attr('y', height)
              .attr('x', function(d) { return d.x; })
              .attr('width', function(d) { return d.dx-1; })
              .attr('height', 0)
              .call(tooltip)
              .on('mouseover', tooltip.show)
              .on('mouseout', tooltip.hide)
              .transition()
                .duration(1000)
                .attr('y', function (d) { return y1(d.value); })
                .attr('height', function(d) { return height-y1(d.value); });

          var yAxis = d3.svg.axis()
            .scale(y1)
            .orient('left')
            .ticks(10);

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
            .call(currentXAxis)
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

          var barWidth = width / currentData.length;

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
            .attr("x1", function(d) { return d.x; })
            .attr("x2", function(d) { return d.x; })
            .attr("cursor", "ew-resize");
          // transparent line, makes it easier to click 
          dragLineGroup.append("line")
            .attr("class", "drag")
            .style("stroke-width", 5)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("x1", function(d) { return d.x; })
            .attr("x2", function(d) { return d.x; })
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

          // function to help with rounding issues caused by inverse mapping of quantile scale
          // assumes array is sorted
          function closestTo(arr, elem) {
            var lo = 0, hi = arr.length-1, mid;
            while (hi - lo > 1) {
              var mid = Math.floor((hi+lo)/2);
              if (arr[mid] < elem) {
                lo = mid;
              } else {
                hi = mid;
              }
            } 
            if (elem - arr[lo] <= arr[hi] - elem) return arr[lo];
            else return arr[hi];
          }

          function dragMove(d) {
            d.x = calculateBound(d, this);
            d3.select(this)
              .attr("x1", d.x)
              .attr("x2", d.x);
            d3.select(this.previousSibling)
              .attr("x1", d.x)
              .attr("x2", d.x);
          }

          function updateHistogram() {
            var data = chart.selectAll('.bin-limits .drag').data();
            var binThresholds = [currentData[0].x];
            if (scope.linearScale) {
              var keys = currentData.map(function(d) { return d.x; });
              data.forEach(function(d) {
                binThresholds.push(closestTo(keys, currentX.invert(d.x)));
              });
              binThresholds.push(currentData.last().x+currentData.last().dx);
            } else {
              var keys = currentX.range();
              data.forEach(function(d) {
                binThresholds.push(reverseQuantile[currentX.invertExtent(closestTo(keys,d.x))]);
              });
              binThresholds.push(currentX.domain().last());
            }
            var binThresholdsSorted = binThresholds.sort(function(a, b){return a-b});
            scope.createHistogramFromRange(binThresholdsSorted);  
          }
        }

        scope.removeDraggable = function() {
          chart.selectAll('.bin-limits').remove();
        }

        scope.$watch('column', function(column) {
          scope.changeScale(scope.linearScale);
          scope.createBarGraph(scope.linearScale);
        });

        scope.$on('change_scale', function(event, value) {
          scope.changeScale(value);
          scope.createBarGraph(value);
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