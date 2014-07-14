    //--------------------------------------------------------------
    // ### Bar charts

    // *Bar charts* are useful for comparing categories of things. Bar charts
    // are rendered horizontally: if you would like vertical bars, see the *ColumnChart*.
    //
    // A bar chart appears like so:
    //
    // ![Bar chart example](http://brandseye.github.io/brandseyejs/images/bar-chart.png)
    namespace.BarChart = function() {
        namespace.Graph.prototype.createAttributes.call(this);
        return this;
    };

    namespace.BarChart.prototype = new namespace.Graph();
    namespace.BarChart.prototype.createChart = function() { return nv.models.multiBarHorizontalChart(); };
    namespace.BarChart.prototype.labelPosition = "rows";

    namespace.BarChart.prototype.initialiseData = function() {
        var data = this.data(),
            xAxisOverride = this.xAxisOverride(),
            xAxisRestriction = 25,
            maxLabelLength = 0,
            x = this.x();

        if (data) {
            _(data).each(function(s, i) {
                _(s.values).each(function(d) {
                    d.legendKey = i;
                    var item = x(d);
                    if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                    var length = xAxisTickFormat(xAxisRestriction, item.toString()).length;
                    if (length > maxLabelLength) {
                        maxLabelLength = length;
                    }
                });
            });
        }

        this.attributes.maxLabelLength = maxLabelLength;
    };

    namespace.BarChart.prototype.preRenderXAxisTicks = function() {
        this.nvChart().xAxis.tickFormat(_.partial(xAxisTickFormat, xAxisRestriction));
    };

    namespace.BarChart.prototype.calculateLegendMargin = function() {
        return {top: 0, left: 30, right: this.width()};
    };

    namespace.BarChart.prototype.calculateMargins = function(selection) {
        var margins = {left: 30, right: 30, top: 20, bottom: 20},
            padding = this.padding();
        var maxLabelLength = this.attributes.maxLabelLength || 0;

        margins.bottom = (margins.bottom || 0) + this.attributes.legend.finalHeight() + 20;

        if (maxLabelLength) {
            margins.left = maxLabelLength * 8; // Budgeting a set pixel width per letter (innacurate because not-fixed width font in use)
        }

        margins.left += padding.left;
        margins.right += padding.right;
        margins.bottom += padding.bottom;
        margins.top += padding.top;

        return margins;
    };
