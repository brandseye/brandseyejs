//--------------------------------------------------------------
// ### Area charts

// Similar to sparklines, these also colour the area under the chart.
//
// The example is almost identical to the sparkline example. Do remember to
// define the width and height in css of the item you are drawing to.
//
//     // Provide the element and the data
//     brandseye.charts.Area($('.area')[0], [
//         {x: 0, y: 0},
//         {x: 1, y: 2},
//         {x: 2, y: 1},
//         {x: 3, y: 3},
//         {x: 4, y: 5},
//         {x: 5, y: 0}
//     ]);
//
// Area charts appear like so:
//
// ![Area chart example](http://brandseye.github.io/brandseyejs/images/area-chart.png)
namespace.Area = function (selector, data, x, y) {
    x = x || function (d) {
        return d.x;
    };
    y = y || function (d) {
        return d.y;
    };

    var $main = $(selector);
    var width = $main.width(),
        height = $main.height();

    if (!$('svg', $main).length) {
        $main.html('<svg></svg>');
    }

    var svg = d3.select($main[0]).select('svg');
    svg
        .attr('width', width)
        .attr('height', height)
        .classed('bm', true)
        .classed('chart-sparkline', true);

    var minX = x(_(data).min(x));
    var maxX = x(_(data).max(x));
    var minY = y(_(data).min(y));
    var maxY = y(_(data).max(y));

    var xScale = d3.scale.linear().domain([minX, maxX]).range([0, width]);
    var yScale = d3.scale.linear().domain([minY, maxY]).range([height, 0]);

    var area = d3.svg.area()
        .x(function (d) {
            return xScale(x(d));
        })
        .y0(height)
        .y1(function (d) {
            return yScale(y(d));
        });

    var areas = svg.selectAll('.bm-chart-sparkline-area').data([data]);
    areas.exit().remove();
    areas.enter()
        .append('path')
        .classed('bm-chart-sparkline-area', true)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1.0);

    areas.attr('d', area);
};
