//--------------------------------------------------------------
// ## Basic graph functionality

// Most of the graphs are built by extending the **Graph** object, which
// defines much of the basic graphing functionality.
//
// The simplest way of displaying a graph (in this case, a bar chart),
// is like this:
//
//     // First we define an array of x / y data points.
//     var data = [
//         { x: "apples", y: 10 },
//         { x: "oranges", y: 5},
//         { x: "pears", y: 7},
//         { x: "bananas", y: 11}
//     ];
//
//     // Then we create a chart of our choice.
//     var graph = new brandseye.charts.BarChart();
//
//     // Then set the data and specify a dom element
//     // on which to render the data.
//     graph
//         .data(data)
//         .element($('.container')[0])
//         .render();
namespace.Graph = function () {
    return this;
};

// ### Graph definition

// **Graph** is defined as a collection of functions that children can override to do things
// such as set up axes, display data (as bars, lines, etc.) and so on.
//
// A graph has multiple elements, including the axes and their labels, the labels
// on the individual data elements, and a legend.
namespace.Graph.prototype = {

    // Javascript does not have a great way to provide member data
    // encapsulation. Here we're placing the member data in set called attributes.
    // Since we want the member data to be unique to each instance, we create it here
    // in the constructor, rather than below in the prototype.
    createAttributes: function () {
        this.attributes = {
            data: [],
            width: 250,
            height: 250,
            duration: 250,
            x: function (d) {
                return d.x;
            },
            y: function (d) {
                return d.y;
            },
            colours: brandseye.colours.scheme,
            showLegend: true,
            coarseness: 'daily',
            padding: {left: 0, right: 0, bottom: 0, top: 0},
            dispatch: d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick', 'tooltipShow', 'tooltipHide'),
            labelFormat: d3.format(',.f'),
            tickFormat: d3.format(',.f'),
            showLabels: false,
            zeroOpacity: 0
        };
    },

    // This does the bulk of the work in calling the different functions that define a chart at the appropriate
    // times. It is the function that you should finally call when drawing a chart.
    render: function () {
        this.setup();

        var parent = d3.select(this.element());

        if (parent.selectAll('svg').empty()) {
            parent.append('svg');
        }

        var svg = parent.select('svg');
        var nvChart = this.attributes.nvChart;

        var that = this;
        svg
            .datum(this.getDataToSet())
            .transition()
            .duration(this.duration())
            .call(function (selection) {

                that.initialiseData();
                that.arrangeLegend(selection);
                var margins = that.calculateMargins(selection);

                if (that.dataAxisLabel() && (that.labelPosition == "rows" || that.labelPosition == "columns")) {
                    var dataAxisLabelOffset = that.drawAxisDataLabel(selection, margins);
                    if (that.labelPosition == "columns") margins.left = (margins.left || 0) + dataAxisLabelOffset;
                    if (that.labelPosition == "rows") margins.bottom = (margins.bottom || 0) + dataAxisLabelOffset;
                }

                that.setupChart(margins);

                if (that.attributes.forceMaxY) {
                    if (nvChart.forceY) nvChart.forceY([that.attributes.forceMinY, that.attributes.forceMaxY]);
                    else if (nvChart.multibar) nvChart.multibar.forceY([that.attributes.forceMinY, that.attributes.forceMaxY]);
                }

                that.preRenderXAxisTicks();
                that.preRenderYAxisTicks();

                nvChart(selection);

                that.postRenderXAxisTicks();
                that.postRenderYAxisTicks();

                that.setupContainer();
                that.arrangeTicks();
                that.arrangeLabels(selection);

                var container = d3.select(nvChart.container);
                setupDispatcher(that.dispatch(), container, that.graphDispatch(), nvChart.dispatch, that.data(), that.interactiveClass(), that.dataTransform);

                if (nvChart.multibar) {
                    markUnknownAndOthers(selection, that.x());
                }
            });
        return this;
    },

    // This performs some initial setup for the first time that the chart is rendered.
    setup: function () {
        if (!this.attributes.hasBeenSetup) {
            this.attributes.nvChart = this.createChart();
            this.attributes.legend = namespace.chartLegend();
            this.attributes.labels = namespace.chartLabel();
        }
        this.attributes.hasBeenSetup = true;
    },

    // Override this function to return an instance of the nvchart
    // that the child of *Graph* should use.
    createChart: function () {
        throw new Error("createChart not implemented");
    },

    // This method is meant to run through the data set and initialise any extra
    // values that might be needed. This default implementation also determines the maximum length
    // of labels that should be displayed.
    initialiseData: function () {
        var data = this.data();
        var maxLabelLength = 0;
        var tickFormat = this.tickFormat();

        if (data) {
            _(data).each(function (s, i) {
                _(s.values).each(function (d) {
                    d.legendKey = i;
                    var length = tickFormat(d).length;
                    if (length > maxLabelLength) {
                        maxLabelLength = length;
                    }
                });
            });
        }

        this.attributes.maxLabelLength = maxLabelLength;
    },

    // Most of the charts will want to set data in the default format.
    // Some, like the piechart, expect the data formatted slightly
    // differently. This is a great way to do whatever work needs to be done in
    // formatting and setting the data on the chart.
    getDataToSet: function () {
        return this.data();
    },

    // A helper method for draw labels on the x axis.
    drawAxisDataLabel: function (selection, margins) {
        var finalHeight = 0,
            orientation = this.labelPosition,
            label = this.dataAxisLabel(),
            width = this.width(),
            height = this.height(),
            zeroOpacity = this.zeroOpacity();


        margins = _.extend({
            left: 0,
            top: 0,
            bottom: 0,
            right: 0
        }, margins || {});

        var data = this.data();
        if (data) {
            selection.each(function () {
                var labelSelection = d3.select(this).selectAll('.data-label').data([label]);
                labelSelection.enter()
                    .append('text')
                    .style('opacity', zeroOpacity)
                    .classed('data-label', true);

                labelSelection.text(label.long);
                var bbox = labelSelection.node().getBBox();

                if (bbox.width > (orientation === 'rows' ? (width - margins.left - margins.right) * 3 / 4 : (height - margins.bottom - margins.top) * 3 / 4)) {
                    labelSelection.text(label.short);
                    bbox = labelSelection.node().getBBox();
                }

                var x = 0,
                    y = 0;
                var buffer = orientation == "columns" ? 5 : 0;

                if (orientation == "rows") {
                    x = margins.left + (width - margins.left - margins.right) / 2 - bbox.width / 2;
                    y = height - margins.bottom + bbox.height;
                }
                else if (orientation == "columns") {
                    x = bbox.height;
                    y = margins.top + (height - margins.bottom - margins.top) / 2 + bbox.width / 2;
                }
                else throw new Error('Unrecognised orientation [' + orientation + ']');

                labelSelection
                    .attr('transform', function () {
                        var translate = "translate(" + [x + buffer, y] + ")";
                        if (orientation == "columns") return translate + " rotate(-90)";
                        return translate;
                    })
                    .transition()
                    .duration(750)
                    .style('opacity', 1);

                finalHeight = bbox.height + buffer;
            })
        }

        return finalHeight;
    },

    // This method sets up basic properties of the chart. For example, it can set up the drawing
    // extants. The default versions sets up an nvd3 chart.
    setupChart: function (margins) {
        var nvChart = this.nvChart();

        nvChart
            .margin(margins)
            .width(this.width())
            .height(this.height())
            .showLegend(false)
            .x(this.x())
            .y(this.y())
            .noData(loadingText)
            .tooltips(false)
            .color(this.colours());

        if (nvChart.reduceXTicks) nvChart.reduceXTicks(false);
        if (nvChart.showControls) nvChart.showControls(false);
        // For piecharts.
        if (nvChart.showLabels) nvChart.showLabels(false);
    },

    // This is used to update the x axis before rendering
    preRenderXAxisTicks: function () {
    },

    // And this is used to update the x axis after rendering.
    postRenderXAxisTicks: function () {
        var nvChart = this.nvChart();
        var container = d3.select(nvChart.container);
        var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
        xTicks.selectAll('text').classed('x-axis-label', true);

        overrideAxisLabels(xTicks, this.xAxisOverride());
        addTooltips(xTicks, this.xAxisTooltips());
    },

    // Set up the y axis before we render the chart.
    preRenderYAxisTicks: function () {
        var nvChart = this.nvChart();
        if (nvChart.yAxis) {
            nvChart.yAxis
                .tickFormat(this.tickFormat())
                .showMaxMin(false);
        }
    },

    // Modify the y axis after we've rendered the chart.
    postRenderYAxisTicks: function () {
        var nvChart = this.nvChart();
        var container = d3.select(nvChart.container);
        var yTicks = container.select('.nv-y.nv-axis > g').selectAll('g');
        yTicks.selectAll('text').classed('y-axis-label', true);
        addTooltips(yTicks, this.tickFormat());
    },

    // This is a useful method to override when setting up the container
    // that we're rendering to, such as its background colour, and so on.
    setupContainer: function () {
        var nvChart = this.nvChart();
        var xScale = nvChart.multibar.xScale();
        var yScale = nvChart.multibar.yScale();
        var container = d3.select(nvChart.container);
        var height = Math.max.apply(Math.max, yScale.range()),
            width = _(xScale.rangeExtent()).last();


        // In this case, our width and height values have been swapped.
        // This happens, for instance, when rendering bar charts.
        if (yScale.range()[0] == 0) {
            var tmp = height;
            height = width;
            width = tmp;
        }

        // All of our containers (usually SVG divs) are marked with the *.bm* class.
        container.classed('bm', true);

        container.selectAll('.chart-background').remove();
        container.select('.nv-wrap').insert('rect', ':first-child')
            .attr('class', 'chart-background')
            .attr('fill', this.backgroundColour())
            .attr('width', width)
            .attr('height', height);
    },

    // Used to determine how much space the chart's legend should take.
    calculateLegendMargin: function () {
        return {top: 0, left: 60, right: this.width()};
    },

    // This draws the legend on the chart.
    arrangeLegend: function (selection) {
        this.attributes.legend
            .colours(this.colours())
            .margin(this.calculateLegendMargin())
            .height(this.height())
            .width(this.width())
            .showLegend(this.showLegend());
        selection.call(this.attributes.legend);
    },

    // This is the default margins that the graph should have. It is used
    // in *calculateMargins()* to determine the true margins of the charts.
    defaultMargins: function () {
        return {
            top: 30,
            bottom: (this.coarseness() === 'weekly' ? 45 : 40),
            left: 40,
            right: 20
        };
    },

    // Calculates the margins the chart requires, using the *defaultMargins()* of the chart.
    // It also takes in to account features such as the legend size.
    calculateMargins: function (selection) {
        var maxLabelLength = this.attributes.maxLabelLength || 0;
        var margins = this.defaultMargins();
        var padding = this.padding();

        if (maxLabelLength) margins.left = (margins.left || 0) + maxLabelLength * 10;

        margins.left += padding.left;
        margins.right += padding.right;
        margins.bottom += padding.bottom;
        margins.top += padding.top;

        margins.bottom = margins.bottom + this.attributes.legend.finalHeight() + this.defaultMarginBottom();

        return margins;
    },

    defaultMarginBottom: function () {
        return 20;
    },

    // Override to supply code that will arrange the axis bar ticks.
    arrangeTicks: function () {
        d3.select(this.nvChart().container)
            .select('.nv-x.nv-axis > g')
            .selectAll('g')
            .selectAll('.tick > line')
            .style('opacity', this.zeroOpacity());
    },

    // This renders labels on the chart.
    arrangeLabels: function (selection) {
        var nvChart = this.nvChart(),
            labels = this.labels();

        labels
            .x(this.x())
            .y(this.y())
            .width(this.width() - nvChart.margin().left - nvChart.margin().right)
            .height(this.height())
            .xScale(nvChart.multibar.xScale())
            .yScale(nvChart.multibar.yScale())
            .delay(nvChart.delay())
            .format(this.labelFormat())
            .position(this.labelPosition)
            .determineCompression(this.labelCompression())
            .zeroOpacity(this.zeroOpacity())
            .showLabels(this.showLabels());
        labels(selection);
    },

    labelPosition: "columns",

    //----------------------------------------
    // ### Getters and Setters
    // The getters and setters provide access to the various data elements that a graph requires.
    // Most of the functions below act as both getters and setters. When given an argument, they will
    // set the value of an item, and then return the graph object, allowing calls to be chained. When used
    // with no argument, they will merely return the data element.
    //
    // An example of using this:
    //
    //        graph
    //            .data(data)
    //            .element($('.graph')[0]);

    // **data()** sets the data to be displayed. The data can be provided in a number of formats.
    // The simplest is to provide an array of objects with x / y values, like so:
    //
    //        var data = [
    //            { x: "orange", y: "10" },
    //            { x: "apple", y: "11" },
    //            { x: "banana", y: "12" },
    //        ];
    //        graph.data(data);
    //
    // It is also possible to provide a series of comparison data, which are labeled, like so:
    //
    //        var data = [{
    //                key: "Fruit",
    //                values: [
    //                    { x: "apples", y: 10 },
    //                    { x: "oranges", y: 5},
    //                    { x: "pears", y: 7},
    //                    { x: "bananas", y: 11}
    //                ]
    //            },
    //            {
    //                key: "Herb",
    //                values: [
    //                    { x: "Thyme", y: 10 },
    //                    { x: "Rosemary", y: 5},
    //                    { x: "Sage", y: 7},
    //                    { x: "Taragon", y: 11}
    //                ]
    //            }
    //        ];
    //        graph.data(data);
    data: function (data) {
        if (!arguments.length) return this.attributes.data;
        if (data && !data.length) data = [data];
        if (data && data[0].key === undefined) {
            data = [
                {
                    key: "series 1",
                    values: data
                }
            ];
        }

        this.attributes.data = data || [];
        return this;
    },

    // Sets the element in which the graph should be displayed. This
    // should be native dom element (rather than a jquery or d3 selection).
    element: function (_) {
        if (!arguments.length) return this.attributes.element;
        this.attributes.element = _;
        return this;
    },

    // Gets the underlying nvd3 (or other element) used to create this chart.
    nvChart: function () {
        return this.attributes.nvChart;
    },

    width: function (_) {
        if (!arguments.length) return this.attributes.width;
        this.attributes.width = _;
        return this;
    },

    height: function (_) {
        if (!arguments.length) return this.attributes.height;
        this.attributes.height = _;
        return this;
    },

    // **x()** and **y()** specify how to obtain the *x* and *y* components
    // from the individual data values. They default to returning the values for keys
    // names x (or similarly y) from the data. The default implementations are equivalent to this:
    //
    //        graph
    //            .x(function(d) { return d.x; })
    //            .y(function(d) { return d.y; });
    //
    // These should be set to obtain the appropriate data from your own data set.
    x: function (_) {
        if (!arguments.length) return this.attributes.x;
        this.attributes.x = _;
        return this;
    },

    y: function (_) {
        if (!arguments.length) return this.attributes.y;
        this.attributes.y = _;
        return this;
    },

    // Pass this a function to provide formatting of x axis values.
    // This function will be passed two values. The first is the value
    // that should be formatted. The second is a number indicating the amount
    // of visual compression that the number value should have. The larger
    // this number, the larger the amount of visual compression.
    tickFormat: function (_) {
        if (!arguments.length) return this.attributes.tickFormat;
        this.attributes.tickFormat = _;
        return this;
    },

    // Pass a function to format data labels.
    labelFormat: function (_) {
        if (!arguments.length) return this.attributes.labelFormat;
        this.attributes.labelFormat = _;
        return this;
    },

    labelCompression: function (_) {
        if (!arguments.length) return this.attributes.labelCompression;
        this.attributes.labelCompression = _;
        return this;
    },

    // Set to true / false depending on whether you want to show or hide the labels.
    showLabels: function (_) {
        if (!arguments.length) return this.attributes.showLabels;
        this.attributes.showLabels = _;
        return this;
    },

    // Provides access to the element that draws the labels on the charts.
    labels: function () {
        return this.attributes.labels;
    },

    tooltip: function (_) {
        return this;
    },

    // If you need the *y*-axis to cover a particular range, pass this function an
    // array containing the minimum and maximum range.
    forceY: function (force) {
        if (!arguments.length) return [this.attributes.forceMinY, this.attributes.forceMaxY];
        if (_.isArray(force)) {
            this.attributes.forceMinY = force[0];
            this.attributes.forceMaxY = force[1];
        }
        else {
            this.attributes.forceMinY = 0;
            this.attributes.forceMaxY = force;
        }
        return this;
    },

    // Pass this an array of values to use for the *x*-axis tooltips.
    xAxisTooltips: function (_) {
        if (!arguments.length) return this.attributes.xAxisTooltips;
        this.attributes.xAxisTooltips = _;
        return this;
    },

    // This allows you to override the display values for *x*-axis components.
    xAxisOverride: function (_) {
        if (!arguments.length) return this.attributes.xAxisOverride;
        this.attributes.xAxisOverride = _;
        return this;
    },

    // An array of colours to be used by the graph. For most graphs, this is the colour per data series.
    // For the pie chart, this would be the colour per slice.
    colours: function (_) {
        if (!arguments.length) return this.attributes.colours;
        this.attributes.colours = (_ && _.length) ? _.concat(brandseye.colours.allColours) : brandseye.colours.allColours;
        return this;
    },

    backgroundColour: function (_) {
        if (!arguments.length) return this.attributes.backgroundColour || backgroundColour;
        this.attributes.backgroundColour = _;
        return this;
    },

    // Of use for the histogram. It defines the time period of the *x*-axis. It may be set to:
    // - hourly
    // - daily
    // - weekly
    // - monthly
    // - yearly
    //
    // and defaults to daily.
    coarseness: function (_) {
        if (!arguments.length) return this.attributes.coarseness;
        this.attributes.coarseness = _;
        return this;
    },

    // Set to true / false whether the legend should be shown or hidden.
    showLegend: function (_) {
        if (!arguments.length) return this.attributes.showLegend;
        this.attributes.showLegend = _;
        return this;
    },

    // Use this to provide a label for the numerical data axis of the chart. This can
    // either be a string, or it could be a map providing an option of a longer or shorter
    // string depending on the amount of available space:
    //
    //     {
    //       long: "Percentage of global fruit output by country",
    //       short: "% output"
    //     }
    dataAxisLabel: function (label) {
        if (!arguments.length) return this.attributes.dataAxisLabel;
        if (_(label).isString()) label = { long: label, short: label };
        this.attributes.dataAxisLabel = label;
        return this;
    },

    // By default, the library will use an opacity of zero to make things
    // invisible. Unfortunately, in some situations (for instance, when
    // using this library in jsdom) this opacity value is not always applied properly.
    // In that case, you can choose a custom value to use here.
    zeroOpacity: function (_) {
        if (!arguments.length) return this.attributes.zeroOpacity;
        this.attributes.zeroOpacity = _;
        return this;
    },

    // The graphs are animated, and this is how long they should be animated for, in milliseconds.
    // This defaults to 250.
    duration: function (_) {
        if (!arguments.length) return this.attributes.duration;
        this.attributes.duration = _;
        return this;
    },

    // A map giving the amount of space to be added around the chart.
    padding: function (_) {
        if (!arguments.length) return this.attributes.padding;
        this.attributes.padding = {
            top: _.top || 0,
            bottom: _.bottom || 0,
            left: _.left || 0,
            right: _.right || 0
        };
        return this;
    },

    // Provides access to a [d3 event dispatch object](https://github.com/mbostock/d3/wiki/Internals#wiki-events),
    // for handling events fired by the graph. The following events are supported:
    // - *elementClick*. Fired when elements, such as bars, are left clicked once.
    // - *elementMiddleClick*. Fired when elements, such as bars, are middle clicked.
    // - *elementRightClick*. Fired when elements, such as bars, are right clicked once.
    // - *tooltipShow*. Fired when it is appropriate to show a tooltip.
    // - *tooltipHide*. Fired when a tooltip should be hidden.
    dispatch: function () {
        return this.attributes.dispatch;
    },

    // Returns the [d3 dispatch](https://github.com/mbostock/d3/wiki/Internals#wiki-events) associated with
    // the underlying graph element
    graphDispatch: function () {
        var nvChart = this.nvChart();
        if (nvChart.multibar) return nvChart.multibar.dispatch;
        if (nvChart.pie) return nvChart.pie.dispatch;
        if (nvChart.lines) return nvChart.lines.dispatch;
        throw new Error("Unable to determine graph dispatch");
    },

    // This is the class of the item that should be interactive in the graph, such as bars or pie slices.
    interactiveClass: function () {
        return '.nv-bar';
    },

    dataTransform: function (data) {
        return data;
    }
};
