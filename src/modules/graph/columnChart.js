//--------------------------------------------------------------
// ### Column charts

// *Column charts* are useful for comparing categories of things. Column charts
// are rendered vertically: if you would like horizontal bars, see the *BarChart*.
//
// This is an example of a column chart:
// ![Histogram example](http://brandseye.github.io/brandseyejs/images/column-chart.png)
namespace.ColumnChart = function () {
    namespace.Graph.prototype.createAttributes.call(this);
    return this;
};

namespace.ColumnChart.prototype = new namespace.Graph();
namespace.ColumnChart.prototype.createChart = function () {
    return nv.models.multiBarChart();
};

namespace.ColumnChart.prototype.initialiseData = function () {
    var data = this.data();

    if (data) {
        var xAxisOverride = this.xAxisOverride(),
            x = this.x(),
            y = this.y(),
            tickFormat = this.tickFormat(),
            maxXLabelLength = 0,
            maxYLabelLength = 0;

        _(data).each(function (s, i) {
            _(s.values).each(function (d) {
                // Store an index for legends.
                d.legendKey = i;

                // Determine length for x axis
                var item = x(d);
                if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                var length = xAxisTickFormat(xAxisRestriction, item.toString()).length;
                if (length > maxXLabelLength) {
                    maxXLabelLength = length;
                }

                // Determine length for y axis
                item = tickFormat(y(d));
                length = item.toString().length;
                if (length > maxYLabelLength) {
                    maxYLabelLength = length;
                }
            });
        });

        this.attributes.maxXLabelLength = maxXLabelLength;
        this.attributes.maxYLabelLength = maxYLabelLength;
    }
};

namespace.ColumnChart.prototype.preRenderXAxisTicks = function () {
    this.nvChart().xAxis.tickFormat(_.partial(xAxisTickFormat, xAxisRestriction));
};

namespace.ColumnChart.prototype.postRenderXAxisTicks = function () {
    var nvChart = this.nvChart(),
        xAxisOverride = this.xAxisOverride(),
        container = d3.select(nvChart.container),
        xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');

    container.select('.nv-x.nv-axis > g').selectAll('g').selectAll('text')
        .filter(function (d) {
            return d != null && ((xAxisOverride && xAxisOverride[d] && xAxisOverride[d].length > 2) || d.toString().length > 2 )
        })
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-30 0,0)');

    overrideAxisLabels(xTicks, this.xAxisOverride());
    addTooltips(xTicks, this.xAxisTooltips());
};

namespace.ColumnChart.prototype.calculateLegendMargin = function () {
    return { top: 0, left: this.nvChart().margin().left, right: this.width() };
};

namespace.ColumnChart.prototype.calculateMargins = function () {
    var margins = nv.models.multiBarChart().margin(),
        padding = this.padding();
    margins = {
        top: margins.top,
        bottom: margins.bottom,
        left: margins.left,
        right: margins.right
    };
    var maxXLabelLength = this.attributes.maxXLabelLength || 0,
        maxYLabelLength = this.attributes.maxYLabelLength || 0;

    margins.bottom = (margins.bottom || 0) + this.attributes.legend.finalHeight();

    if (maxXLabelLength) {
        // Budgeting a set pixel width per letter (innacurate because not-fixed width font in use)
        // This may be an odd number because the labels are rotated.
        margins.bottom = (margins.bottom || 0) + maxXLabelLength * 3;
    }

    if (maxYLabelLength) {
        margins.left = (margins.left || 0) + maxYLabelLength * 3;
    }

    margins.left += padding.left;
    margins.right += padding.right;
    margins.bottom += padding.bottom;
    margins.top += padding.top;

    return margins;
};
