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

          var y1 = d3.scale.linear()
            .domain([0, d3.max(hist, function(d) { return d.y; })])
            .range([height, 0]);

          var histData = hist.map(function(d) {
            return {
              x: barWidth*reverseKeys[d.x],
              y: y1(d.y),
              width: barWidth*(reverseKeys[d.x + d.dx] - reverseKeys[d.x])-1,
              height: height - y1(d.y)
            }
          });
          console.log(histData);

          d3.select(selectorHist)
            .attr('width', options.width)
            .attr('height', options.height);

          var bars = histogramChart.selectAll('rect')
            .data(histData, function(d,i) {return 'hist-'+d.y+'-'+i;}).enter()
            .insert('g', ':first-child')
              .attr('class', 'bin-bar')
              .append('rect')
              .attr('y', function(d) { return d.y; })
              .attr('x', function(d) { return d.x; })
              .attr('width', function(d, i) { return d.width; })
              .attr('height', function(d) {return d.height; });

          var yAxis = d3.svg.axis()
            .scale(y1)
            .orient('left')
            .ticks(10);

          // add y axis
          histogramChart.append('g')
            .attr('class', 'y axis right')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 10)
            .style('text-anchor', 'end')
            .text('value Value');
        }

        scope.removeHistogram = function() {
          histogramChart.selectAll('.bin-bar').remove();
          histogramChart.selectAll('.y.axis.right').remove();
          d3.select(selectorHist)
            .attr('width', 0)
            .attr('height', 0);
        }

        scope.addDraggable = function() {
          var dragbarw = 10;

          var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragMove);
            // .on("dragend" updateHistogram);

          var dragRight = d3.behavior.drag()
            .origin(Object)
            .on("drag", rdragresize)
            .on("dragend", function(d) {
              var newWidth = d3.select(this.previousSibling.previousSibling).attr('width');
              d.width = +newWidth;
            });

          var dragLeft = d3.behavior.drag()
            .origin(Object)
            .on("drag", ldragresize);            

          // chart.selectAll('.bin-bar').call(drag);

          var dragLine = chart.selectAll('.bin-bar')
            .append("line")
            .attr("class", "drag")
            .style("stroke", "blue")
            .style("stroke-width", 2)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("x1", function(d) { return d.x })
            .attr("x2", function(d) { return d.x })
            .attr("cursor", "ew-resize")
            .call(drag);

          // var dragBarLeft = chart.selectAll('.bin-bar')
          //   .append("rect")
          //   .attr("x", function(d) { return d.x })
          //   .attr("y", function(d) { return d.y })
          //   .attr("height", function(d) { return d.height; })
          //   .attr("class", "drag-left")
          //   .attr("width", barWidth -1)
          //   .attr("cursor", "ew-resize")
          //   .call(dragLeft);

          // var dragBarRight = chart.selectAll('.bin-bar')
          //   .append("rect")
          //   .attr("x", function(d) { return d.x + d.width - barWidth + 1 })
          //   .attr("y", function(d) { return d.y })
          //   .attr("height", function(d) { return d.height; })
          //   .attr("class", "drag-right")
          //   .attr("width", barWidth -1)
          //   .attr("cursor", "ew-resize")
          //   .call(dragRight);

          function leftBound(elem) {
            var prevElem = $(elem).parent().next().find('.drag');
            var d = d3.selectAll(prevElem).data()[0];
            return d.x + barWidth;
          }

          function calculateBound(d, elem) {
            var positionSnap = Math.round(d3.event.x/barWidth)*barWidth;
            return Math.max(leftBound(elem), Math.min(d.x + d.width - barWidth, positionSnap));
          }

          function calculateLeftBound(d) {
            //Max x on the right is x + width - barWidth
            //Max x on the left is 0 - (barWidth/2)
            var positionSnap = Math.round(d3.event.x/barWidth)*barWidth;
            return Math.max(0, Math.min(d.x + d.width - barWidth, positionSnap));
          }

          function calculateRightBound(d, offset) {
            //Max x on the left is x - width 
            //Max x on the right is width of screen + (barWidth/2)
            var positionSnap = Math.round((offset + d3.event.x)/barWidth)*barWidth;
            return Math.max(d.x + barWidth, Math.min(width, positionSnap));
          }

          function dragMove(d) {
            var oldx = d.x; 
            d.x = calculateBound(d, this);
            d.width = d.width + (oldx - d.x);
            var xdiff = d.x - oldx;
            d3.select(this)
              .attr("x1", d.x)
              .attr("x2", d.x);
          }

          function ldragresize(d) {
            var oldx = d.x; 
            d.x = calculateLeftBound(d);
            d.width = d.width + (oldx - d.x);
            d3.select(this)
              .attr("x", function(d) { return d.x; });

            d3.select(this.previousSibling)
              .attr("x", function(d) { return d.x; })
              .attr("width", function(d) { return d.width });
          }

          function rdragresize(d) {
            var dragx = calculateRightBound(d, d.width);
            var w = dragx - d.x - 1;

            //move the right drag handle
            d3.select(this)
              .attr("x", function(d) { return dragx - barWidth });

            //resize the drag rectangle
            //as we are only resizing from the right, the x coordinate does not need to change
            d3.select(this.previousSibling.previousSibling)
              .attr("width", w);

          }
        }

        scope.removeDraggable = function() {
          chart.selectAll('.bin-bar .drag-left').remove();
          chart.selectAll('.bin-bar .drag-right').remove();
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

        scope.$on('remove_draggable', function(event) {
          scope.removeDraggable();
        });
      });
    }
  };
}])