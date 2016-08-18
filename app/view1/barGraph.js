Array.prototype.last = function() {
  return this[this.length - 1];
};

var barGraph = view1Ctrl.directive('barGraph', ['d3Service', 'columnDataService', function(d3Service, dataSvc) {
  function groupData2(histogram, binRange, numBins) {
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

  // Function that takes the histogram values and the bin ranges and combines them into a 
  // single array of objects. Each object will represent a discrete bin.
  function groupHistogramData(histogram, binRange) {
    var chartData = [];
    for (var i=0; i<histogram.length; i++) {
      chartData.push({
        name: binRange[i] + '-' + binRange[i+1], // name of the bin, which are the boundaries
        value: histogram[i], // the count of how many numbers fall into this specific bin
        x: binRange[i], // the position of the bin, used by bar chart
        dx: binRange[i+1]-binRange[i] // width of the bin, used by bar chart.
      });
    }
    return chartData;
  }

  return {
    restrict: 'EA',
    scope: true,
    template: '<svg class="chart_{{column.name}} chart" layout></svg><svg class="chart_{{column.name}}_histogram chart" layout></svg>',
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

        // var chartData = groupData2(scope.column.hist, scope.column.binRange, 100);
        var groupedData = groupHistogramData(scope.column.hist, scope.column.binRange);
        var chartData =  createHistogramFromRange(createEvenlyDistributedRange(100, groupedData), groupedData);
        var chartDataLinear = groupHistogramData(scope.column.histLinear, scope.column.binRangeLinear);
        var threshold = chartData.map(function(d) { return d.x; });
        threshold.push(scope.column.binRange.last()); // add last item to threshold

        // set the width and height based off options given
        var width  = options.width  - options.margin_left - options.margin_right,
            height = options.height - options.margin_top  - options.margin_bottom;

        // create linear scale
        var xLinear = d3.scale.linear()
          .range([0, width])
          .domain([scope.column.binRangeLinear[0], scope.column.binRangeLinear.last()]);

        // quantile scale for histogram equalized data
        var xQuantile = d3.scale.quantile()
          .domain(threshold)
          .range(d3.range(0,width+1,width/chartData.length));
        // reverse mapping for quantile scale, used for calculating bin boundaries
        var reverseQuantile = {};
        xQuantile.range().forEach(function (x, i) {
          var pair = xQuantile.invertExtent(x).toString();
          reverseQuantile[pair] = xQuantile.domain()[i];
        });

        var currentData; // value to store either chartData or chartDataLinear
        var currentX;
        var currentXAxis; // value to store either xLinear or xOrdinal

        function changeScale(isLinear) {
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

        // removes the entire bar graph from svg
        function removeBarGraph() {
          chart.selectAll('rect').remove();
          chart.selectAll('.y.axis').remove();
          chart.selectAll('.x.axis').remove();
        }

        // creates bar graph and tooltip
        function createBarGraph(isLinear) {
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
          removeBarGraph();
          removeDraggableLines();

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
            .text('Values in column ' + scope.column.name);
        }

        // generate the histogram data from dataSet and the bin thresholds
        function createHistogramFromRange(range, dataSet) {
          var histogramData = [];
          var counter = 0;
          var previous = dataSet[0].x;
          // loop through dataSet, and add it to the bins in histogramData
          for (var i=0, j=0; i<dataSet.length; i++) {
            if (i==0) {
              counter += dataSet[i].value;
              j++;
            } else if (range[j] == dataSet[i].x) {
              histogramData.push({
                name: range[j-1] + '-' + range[j],
                value: counter,
                x: range[j-1],
                dx: dataSet[i].x-range[j-1]
              });
              j++;
              counter = dataSet[i].value;
              previous = dataSet[i].x;
            } else if (i == dataSet.length-1) { // need to add last element in array
              counter += dataSet[i].value;
              histogramData.push({
                name: range[j-1] + '-' + range[j],
                value: counter,
                x: range[j-1],
                dx: dataSet[i].x + dataSet[i].dx-range[j-1]
              });
            } else {
              counter += dataSet[i].value;
            }
          }
          return histogramData;
        }

        // creates the bin ranges from a dataset given the total number of bins
        function createEvenlyDistributedRange(bins, dataSet) {
          var binSize = dataSet.length / bins;
          var binCounter = binSize;
          var range = [dataSet[0].x];
          for (var i=1; i<dataSet.length; i++) {
            if (i>=binCounter) {
              range.push(dataSet[i].x);
              binCounter += binSize;
            }
          }
          range.push(dataSet.last().x+dataSet.last().dx); // include right bound
          return range;
        }

        // generate the histogram graph below the bar graph 
        function createHistogramGraph(binThresholds) {
          removeHistogramChart();

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
              .attr('x', function(d) { return currentX(d.x); })
              .attr('width', function(d) { return currentX(d.dx+d.x)-currentX(d.x)-1; })
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

        // removes histogram chart from svg
        function removeHistogramChart() {
          histogramChart.selectAll('.bin-bar').remove();
          histogramChart.selectAll('.line').remove();
          histogramChart.selectAll('.y.axis').remove();
          histogramChart.selectAll('.x.axis').remove();
          d3.select(selectorHist)
            .attr('width', 0)
            .attr('height', 0);
        }

        // adds the lines that the user can use to change the bin thresholds
        function addDraggableLines() {
          var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragMove)
            .on("dragend", updateHistogram); // update data when finished dragging

          var barWidth = width / currentData.length;

          // data is the same as the histogram data; however, the x and dx values are now 
          // retpresented with the x-scale applied. This is to make it easier for determining
          // the lines position.
          var data = histogramChart.selectAll('.bin-bar').data().map(function(d) {
            d.x = currentX(d.x);
            d.dx = currentX(d.dx+d.x)-currentX(d.x);
            return d;
          });
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

          // updates the histogram data and recreates the histogram graph
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
            var histogramData = createHistogramFromRange(binThresholdsSorted, currentData);
            scope.$parent.thresholds = binThresholdsSorted; // update thresholds in parent scope
            createHistogramGraph(histogramData);
          }
        }

        function removeDraggableLines() {
          chart.selectAll('.bin-limits').remove();
        }

        // initializes the bar graph, and sets the current scale as linear
        scope.$watch('column', function(column) {
          changeScale(scope.linearScale); // scope.linearScale comes from parent
          createBarGraph(scope.linearScale);
        });

        // called when the scale changes between linear and quantile
        scope.$on('change_scale', function(event, value) {
          changeScale(value);
          createBarGraph(value);
        });

        // called when the user changes number of categories/bins
        scope.$on('bin_number_changed', function(event, value) {
          var range = createEvenlyDistributedRange(value, currentData);
          var histogramData = createHistogramFromRange(range, currentData);
          scope.$parent.thresholds = range; // update thresholds in parent scope
          createHistogramGraph(histogramData);
        });

        // called when user does not categorize column
        scope.$on('remove_histogram', function() {
          removeHistogramChart();
        });

        // called when user chooses to specify bin boundaries
        scope.$on('add_draggable', function() {
          addDraggableLines();
        });

        // called when evenly distributed checkbox is checked
        scope.$on('remove_draggable', function() {
          removeDraggableLines();
        });
      });
    }
  };
}])