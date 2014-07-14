//--------------------------------------------------------------

// ### Pie charts

// This is an example of a pie chart
// ![Pie chart example](http://brandseye.github.io/brandseyejs/images/pie-chart.png)
namespace.PieChart = function () {
    namespace.Graph.prototype.createAttributes.call(this);
    return this;
};

namespace.PieChart.prototype = new namespace.Graph();
namespace.PieChart.prototype.createChart = function () {
    return nv.models.pieChart();
};
namespace.PieChart.prototype.labelPosition = "circle";

namespace.PieChart.prototype.getDataToSet = function () {
    var data = this.data();
    if (data && data.length) return this.data()[0].values;
    else return data;
};

namespace.PieChart.prototype.initialiseData = function () {
    var data = this.data(),
        xAxisOverride = this.xAxisOverride(),
        x = this.x();

    if (data) {
        _(data).each(function (d) {
            _(d.values).each(function (d, i) {
                d.legendKey = i;
            })
        });

        if (data && data.length) {
            this.attributes.labelItems = _(data[0].values).map(function (d) {
                var item = x(d);
                if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                return { key: item };
            });
        }
        else this.attributes.labelItems = [];

    }
};

namespace.PieChart.prototype.defaultMargins = function () {
    return { top: 0, bottom: 0, left: 0, right: 0 }
};

namespace.PieChart.prototype.defaultMarginBottom = function () {
    return 0;
};

namespace.PieChart.prototype.arrangeLegend = function (selection) {
    this.attributes.legend
        .data(this.attributes.labelItems)
        .colours(this.colours())
        .margin({top: 0, left: 30, right: this.width()})
        .height(this.height())
        .width(this.width())
        .showLegend(this.showLegend())
        .forceLegend(true);
    selection.call(this.attributes.legend);
};

namespace.PieChart.prototype.setupContainer = function (selection) {
    d3.select(this.nvChart().container)
        .classed('bm', true);
};

namespace.PieChart.prototype.arrangeLabels = function (selection) {
    var labels = this.labels(),
        nvChart = this.nvChart();

    labels.x(this.x())
        .y(this.y())
        .width(this.width() - nvChart.margin().left - nvChart.margin().right)
        .height(this.height() - nvChart.margin().top - nvChart.margin().bottom)
        .format(this.labelFormat())
        .position("circle")
        .determineCompression(this.labelCompression())
        .zeroOpacity(this.zeroOpacity())
        .showLabels(this.showLabels());
    labels(selection);
};

namespace.PieChart.prototype.interactiveClass = function () {
    return '.nv-slice';
};

namespace.PieChart.prototype.dataTransform = function (data) {
    return data.data;
};
