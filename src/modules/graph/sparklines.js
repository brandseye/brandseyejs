//--------------------------------------------------------------
// ## Charts not inheriting from Graph
// We have two charts that don't follow the standard chart API: *sparklines* and *area*.

// ### Sparklines

// A sparkline draws a small line without axes or labels. It's a great way to show the outline
// of a data set inside of a text area, such as in a paragraph.
//
// An example of it in use:
//
//     /* Define the area in which to draw the sparkline */
//     .sparkline {
//        width: 100px;
//        height: 1em;
//     }
//
//     // Provide the element and the data
//     brandseye.charts.Sparkline($('.sparkline')[0], [
//         {x: 0, y: 0},
//         {x: 1, y: 2},
//         {x: 2, y: 1},
//         {x: 3, y: 3},
//         {x: 4, y: 5},
//         {x: 5, y: 0}
//     ]);
//
// Sparklines appear like so:
//
// ![sparkline example](http://brandseye.github.io/brandseyejs/images/sparkline.png)

namespace.Sparkline = function (selector, data, x, y) {
    x = x || function (d) {
        return d.x;
    };
    y = y || function (d) {
        return d.y;
    };

    var $main = $(selector);
    if (!$('svg', $main).length) {
        $main.html('<svg></svg>');
    }

    var width = $main.width();
    var height = $main.height();

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

    var line = d3.svg.line()
        .x(function (d) {
            return xScale(x(d));
        })
        .y(function (d) {
            return yScale(y(d));
        })
        .interpolate('linear');

    var lines = svg.selectAll('.bm-chart-sparkline-line').data([data]);
    lines.exit().remove();
    lines.enter().append('path').classed('bm-chart-sparkline-line', true);

    lines.attr('d', line);
};
