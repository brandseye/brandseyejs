//--------------------------------------------------------------
// <a id="charts"></a>
// ## The Charts

// ### Histograms

// The histogram is useful for accumulating discrete values in to buckets,
// such as for showing the number of mentions appearing over time.
//
// This is how a histogram appears:
//
// ![Histogram example](http://brandseye.github.io/brandseyejs/images/histogram.png)
namespace.Histogram = function () {
    namespace.Graph.prototype.createAttributes.call(this);
    return this;
};

namespace.Histogram.prototype = new namespace.Graph();
namespace.Histogram.prototype.createChart = function () {
    return nv.models.multiBarChart();
};

namespace.Histogram.prototype.defaultMarginBottom = function () {
    if (this.coarseness() == 'hourly') return 40;
    return 20;
};

namespace.Histogram.prototype.arrangeTicks = function () {
    var seen = false;
    var that = this;

    var container = d3.select(this.nvChart().container);
    var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
    var xScale = this.nvChart().multibar.xScale();

    var isMonday = function (m) {
        return m.day() === 1 && (m.hour() != 0 || that.coarseness() != "hourly");
    };

    var isDayStart = function (m) {
        return m.hour() == 0 && m.minute() == 0;
    };

    // Here, if there are comparisons, we want to map label dates to lists of comparison dates.
    var comparisons = {};
    if (that.data() && that.data().length > 1) {
        _(that.data()).each(function (s) {
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

    xTicks
        .selectAll('text')
        .classed('x-axis-label', true)
        .each(function (data, position) {
            var m = new moment(data);
            var formatString = 'dddd, MMMM D, YYYY';

            /* TODO There is a bug that makes the data and text elements repeat itself with position always equal to 0. When this begins, data will be null. */
            if (!data || seen) {
                seen = true;
                return;
            }

            /* TODO sometimes we should rotate nothing, if the rangeBand is large enough. */
            var mondayRotate = that.coarseness() != 'hourly' && isMonday(m);
            var rangeBandWidth = that.coarseness() == 'hourly' ? 30 : 20;
            var rotate = xScale.rangeBand() / that.data().length < rangeBandWidth ||
                that.longFormat(m, position) || mondayRotate || isDayStart(m) ||
                _(that.data()).any(function (d) {
                    return d.values[0].published === data;
                });
            var angle = that.coarseness() === 'monthly' || that.coarseness() === 'weekly' ? -30 : -90;
            var yOffset = that.coarseness() === 'monthly' || that.coarseness() === 'weekly' ? 0 : 5;

            d3.select(this)
                .style('text-anchor', rotate ? 'end' : 'middle')
                .attr('class', function (d) {
                    if (!d || (that.coarseness() !== 'daily' && that.coarseness() !== 'hourly')) return "";

                    // Here we want to see if this is the beginning of a month
                    if (m.month() === 0 && m.date() === 1 && isDayStart(m)) return "year-begin";
                    if (m.date() == 1 && isDayStart(m)) return "month-begin";
                    if (m.day() == 1 && isDayStart(m)) return "week-begin";
                    if (that.coarseness() === "hourly" && isDayStart(m)) return "day-begin";
                    return "standard-day";
                })
                .attr('transform', rotate ? 'translate (-10, ' + yOffset + ') rotate(' + angle + ' 0,0)' : '')
                .append('title')
                .text(function (d) {
                    if (_(comparisons).isEmpty() || !comparisons[d]) {
                        switch (that.coarseness()) {
                            case 'weekly':
                                return 'The week of ' + m.format(formatString) + ', to '
                                    + m.clone().add('days', 6).format(formatString);
                            case 'monthly':
                                return 'The month of ' + m.format('MMMM');
                            case 'yearly':
                                return 'The year ' + m.format('YYYY');
                            case 'daily':
                            default:
                                return m.format(formatString);
                        }
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

    if (that.data()) {
        if (xScale.rangeBand() < 12) {
            xTicks.selectAll('text')
                .classed('smaller-text', true);
        }
        if (xScale.rangeBand() < 10) {
            xTicks.selectAll('.standard-day')
                .style('opacity', that.zeroOpacity());
        }
    }

    xTicks.selectAll('.tick > line').style('opacity', this.zeroOpacity());
};

namespace.Histogram.prototype.preRenderXAxisTicks = function () {
    var nvChart = this.nvChart();
    var that = this;


    if (nvChart.xAxis) {
        nvChart.xAxis.tickFormat(function (d, i) {
            if (!dateRegex.test(d)) return d;
            var m = new moment(d);

            switch (that.coarseness()) {
                case 'hourly':
                    if ((that.longFormat(m, i) && m.hour() == 0) || i == 0) return m.format("MMM D, HH:mm");
                    if (m.day() === 1 && m.hour() == 0) return m.format("ddd DD, HH:mm");
                    if (m.hour() == 0) return m.format("ddd D, HH:mm");

                    return m.format("HH:mm");
                case 'daily':
                    if (that.longFormat(m, i)) return m.format("MMM DD");
                    if (m.day() === 1) return m.format("ddd DD");

                    return m.format("DD");
                case 'weekly':
                    var next = m.clone().add('days', 6),
                        label = m.format("MMM DD") + '→';
                    if (next.months() === m.months()) label += next.format("DD");
                    else label += next.format("MMM DD");
                    return label;
                case 'monthly':
                    if (m.month() == 0) return m.format("MMMM ’YY");
                    return m.format("MMMM");
                case 'yearly':
                    return m.format("YYYY");
            }
        });
    }
};

namespace.Histogram.prototype.postRenderXAxisTicks = function () {
};

// Returns true if we should format this date long, rather than just
// with the date.
namespace.Histogram.prototype.longFormat = function(m, i) {
    return i === 0 || (m.date() === 1 && (this.coarseness() !== 'hourly' || (m.hour() == 0 && m.minute() == 0)));
};

