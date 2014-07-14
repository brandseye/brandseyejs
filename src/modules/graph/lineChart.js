//--------------------------------------------------------------
// ### Line charts

// This shows timeseries data. Expects the *x*-axis to show dates.
//
// This is an example of a line chart:
// ![Line chart example](http://brandseye.github.io/brandseyejs/images/line-chart.png)
namespace.LineChart = function () {
    namespace.Graph.prototype.createAttributes.call(this);
    return this;
};

namespace.LineChart.prototype = new namespace.Graph();
namespace.LineChart.prototype.createChart = function () {
    return nv.models.lineChart();
};

namespace.LineChart.prototype.setupContainer = function () {
};
namespace.LineChart.prototype.arrangeLabels = function () {
};

namespace.LineChart.prototype.initialiseData = function () {
    namespace.Graph.prototype.initialiseData.apply(this);
    var data = this.data();
    var chartX = this.x();
    var rewriteX = false;

    _(data).each(function (s) {
        _(s.values).each(function (d) {
            if (_(chartX(d)).isString()) {
                d.publishedStamp = new moment(chartX(d)).unix();
                rewriteX = true;
            }
        })
    });

    if (rewriteX) {
        chartX = function (d) {
            return d.publishedStamp;
        }
    }

    this.attributes.chartX = chartX;
};

namespace.LineChart.prototype.setupChart = function (margins) {
    this.nvChart()
        .margin(margins)
        .width(this.width())
        .height(this.height())
        .showLegend(false)
        .x(this.attributes.chartX)
        .y(this.y())
        .noData(loadingText)
        .tooltips(false)
        .color(this.colours());

    this.nvChart().xScale(d3.time.scale());
};

namespace.LineChart.prototype.preRenderXAxisTicks = function () {
    var chartX = this.attributes.chartX,
        x = this.x();

    this.nvChart().xAxis.tickFormat(function (d, i) {
        if (!dateRegex.test(d) && chartX === x) return d;
        var m = chartX === x ? new moment(d) : moment.unix(d);
        return m.format("MMM DD");
    });
};
namespace.LineChart.prototype.postRenderXAxisTicks = function () {
};

namespace.LineChart.prototype.arrangeTicks = function () {
    var data = this.data(),
        nvChart = this.nvChart(),
        chartX = this.attributes.chartX,
        x = this.x();

    var comparisons = {};
    if (data && data.length > 1) {
        _(data).each(function (s) {
            _(s.values).each(function (d) {
                if (d.originalPublished) {
                    var dates = comparisons[d.published] || [];
                    dates.push(d.originalPublished);
                    comparisons[d.published] = dates;
                }
            });
        });
    }

    // We don't want to include any duplicate dates.
    _(comparisons).each(function (dates, key) {
        comparisons[key] = _(dates).uniq();
    });

    // Now we want to rotate and translate the labels appropriately.
    var seen = false;
    var container = d3.select(nvChart.container);

    var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
    xTicks
        .selectAll('text')
        .classed('x-axis-label', true)
        .each(function (data, position) {
            var m = chartX === x ? new moment(data) : moment.unix(data);
            var formatString = 'dddd, MMMM D, YYYY';

            /* TODO There is a bug that makes the data and text elements repeat itself with position always equal to 0. When this begins, data will be null. */
            if (!data || seen) {
                seen = true;
                return;
            }

            /* TODO sometimes we should rotate nothing, if the rangeBand is large enough. */
            var angle = -30;
            var yOffset = 0;

            d3.select(this)
                .style('text-anchor', 'end')
                .attr('transform', 'translate (-20, ' + yOffset + ') rotate(' + angle + ' 0,0)')
                .append('title')
                .text(function (d) {
                    if (_(comparisons).isEmpty() || !comparisons[d]) {
                        return m.format(formatString);
                    }
                    var dates = comparisons[d];
                    var format = 'ddd MMM D, YYYY';
                    var first = new moment(dates[0]).format(format);
                    return _(comparisons[d]).chain()
                        .drop(1)
                        .reduce(function (memo, date) {
                            return memo + "\nvs\n" + new moment(date).format(format);
                        }, first)
                        .value();
                });
        });

    xTicks.selectAll('.tick > line').style('opacity', this.zeroOpacity());

    container.selectAll('.nv-axisMaxMin text').each(function (data, position) {
        d3.select(this)
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-30, 0,0)');
    });
};
