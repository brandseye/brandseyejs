/*
 * Copyright (C) 2013-2014 BrandsEye (PTY) LTD
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var brandseye = {};

// A basic colour scheme that we use throughout the library.
brandseye.colours = {
    scheme: [
        '#58B6FF',
        '#5473BD',
        '#DF71FC',
        '#9856B0',
        '#ff58a3',
        '#D22D6F',
        '#fc6a4b',
        '#E53E39',
        '#FFD658',
        '#E8AF44',
        '#43C278',
        '#318F58'
    ],
    allColours: [
        '#f0f8ff', '#faebd7', '#00ffff', '#7fffd4', '#f0ffff', '#f5f5dc', '#ffe4c4', '#000000', '#ffebcd', '#0000ff', '#8a2be2',
        '#a52a2a', '#deb887', '#5f9ea0', '#7fff00', '#d2691e', '#ff7f50', '#6495ed', '#fff8dc', '#dc143c', '#00ffff', '#00008b',
        '#008b8b', '#b8860b', '#a9a9a9', '#006400', '#bdb76b', '#8b008b', '#556b2f', '#ff8c00', '#9932cc', '#8b0000', '#e9967a',
        '#8fbc8f', '#483d8b', '#2f4f4f', '#00ced1', '#9400d3', '#ff1493', '#00bfff', '#696969', '#1e90ff', '#d19275', '#b22222',
        '#fffaf0', '#228b22', '#ff00ff', '#dcdcdc', '#f8f8ff', '#ffd700', '#daa520', '#808080', '#008000', '#adff2f', '#f0fff0',
        '#ff69b4', '#cd5c5c', '#4b0082', '#fffff0', '#f0e68c', '#e6e6fa', '#fff0f5', '#7cfc00', '#fffacd', '#add8e6', '#f08080',
        '#e0ffff', '#fafad2', '#d3d3d3', '#90ee90', '#ffb6c1', '#ffa07a', '#20b2aa', '#87cefa', '#8470ff', '#778899', '#b0c4de',
        '#ffffe0', '#00ff00', '#32cd32', '#faf0e6', '#ff00ff', '#800000', '#66cdaa', '#0000cd', '#ba55d3', '#9370d8', '#3cb371',
        '#7b68ee', '#00fa9a', '#48d1cc', '#c71585', '#191970', '#f5fffa', '#ffe4e1', '#ffe4b5', '#ffdead', '#000080', '#fdf5e6',
        '#808000', '#6b8e23', '#ffa500', '#ff4500', '#da70d6', '#eee8aa', '#98fb98', '#afeeee', '#d87093', '#ffefd5', '#ffdab9',
        '#cd853f', '#ffc0cb', '#dda0dd', '#b0e0e6', '#800080', '#ff0000', '#bc8f8f', '#4169e1', '#8b4513', '#fa8072', '#f4a460',
        '#2e8b57', '#fff5ee', '#a0522d', '#c0c0c0', '#87ceeb', '#6a5acd', '#708090', '#fffafa', '#00ff7f', '#4682b4', '#d2b48c',
        '#008080', '#d8bfd8', '#ff6347', '#40e0d0', '#ee82ee', '#d02090', '#f5deb3', '#ffffff', '#f5f5f5', '#ffff00', '#9acd32'
    ]
};

brandseye.utilities = function() {
    return {

        // Restricts the length of a string to the given size. This should cut text
        // at word boundaries, and provide ellipses.
        restrictStringToLength: function(text, length) {
            console.log("===string length thingy", text, "with length", length);
            if (text.length <= length) return text.toString();

            var result = [];
            var word = [];
            for (var i = 0; i < length - 1; i++) {
                var character = text.charAt(i);
                if (character == ' ' || character == '\n') {
                    if (result.length == 0) result = result.concat(word);
                    else {
                        result.push(' ');
                        result = result.concat(word);
                    }
                    word = [];
                } else {
                    word.push(character)
                }
            }

            if (text.length != 0 && result.length == 0) result = text; /* Can happen if the string is a single word longer than length. */
            else result.push('…');

            if (result.length > length) {
                console.log("forceably shortened result returned", result.substring(0, length - 1) + '…');
                return result.substring(0, length - 1) + '…';
            }

            console.log("ellipsed result returned", result.join(''));
            return result.join('');
        }
    }
}();

brandseye.charts = function() {

    var namespace = {
        version: "0.0.1"
    };

    /*
     * Adds tooltips to text items that are children of the selection
     */
    function addTooltips(selection, tooltips) {
        selection.selectAll('text')
            .append('title')
            .text(function(d) {
                if (_(tooltips).isFunction()) return tooltips(d);
                return tooltips && _(tooltips).has(d) ? tooltips[d] : d;
            });
    }

    function overrideAxisLabels(selection, overrides) {
        if (!overrides) return;

        selection
            .selectAll('text')
            .each(function(data) {
                if (overrides[data]) {
                    d3.select(this).text(overrides[data]);
                }
            });
    }

    // TOOD Delete this
    function drawAxisDataLabel(selection, label, margins, width, height, orientation) {
        var finalHeight = 0;
        if (!orientation) orientation = "row";

        margins = _.extend({
            left: 0,
            top: 0,
            bottom: 0,
            right: 0
        }, margins || {});

        selection.each(function (data) {
            if (data) {
                var labelSelection = d3.select(this).selectAll('.data-label').data([label]);
                labelSelection.enter()
                    .append('text')
                    .style('opacity', 0)
                    .classed('data-label', true);

                labelSelection.text(label.long);
                var bbox = labelSelection.node().getBBox();

                if (bbox.width > (orientation === 'row' ? (width - margins.left - margins.right) * 3/4 : (height - margins.bottom - margins.top) * 3/4)) {
                    labelSelection.text(label.short);
                    bbox = labelSelection.node().getBBox();
                }

                var x = 0,
                    y = 0;
                var buffer = orientation == "column" ? 5 : 0;
                console.log("old buffer is ", buffer, orientation);

                if (orientation == "row") {
                    x = margins.left + (width - margins.left - margins.right) / 2 - bbox.width / 2;
                    y = height - margins.bottom + bbox.height;
                }
                else if (orientation == "column") {
                    x = bbox.height;
                    y = margins.top + (height - margins.bottom - margins.top) / 2 + bbox.width / 2;
                }
                else throw new Error('Unrecognised orientation [' + orientation + ']')

                labelSelection
                    .attr('transform', function() {
                        var translate = "translate(" + [x + buffer, y] + ")";
                        if (orientation == "column") return translate + " rotate(-90)";
                        return translate;
                    })
                    .transition()
                    .duration(750)
                    .style('opacity', 1);

                finalHeight = bbox.height + buffer;
            }
        });

        return finalHeight;
    }


    var backgroundColour = '#f8f8f8';
    var defaultLabelRestriction = 15;
    var xAxisRestriction = 25;
    var loadingText = '';

    /**
     * Attempts to limit the text of x-axis labels to an appropriate length.
     * It tries to do this with some level of aesthetic awareness, by first
     * reducing text from the kinds of labels it recognises (such as unwanted
     * information from twitter and facebook, or web urls).
     */
    function xAxisTickFormat(restriction, text) {
        console.log("Restricting ", text, restriction, text);
        text = text.toString();
        if (!restriction) restriction = defaultLabelRestriction;
        if (text.length <= restriction) return text;

        var facebookRegex = /^(\w+)\s+\d+$/;
        var twitterRegex = /^(\w+)\s+\([\w\s]+\)$/;
        var webpage = /^www\.(\w+)\..*$/

        var match;
        if (match = text.match(facebookRegex)) {
            text = match[1] + '…';
        }
        else if (match = text.match(twitterRegex)) {
            text = match[1] + '…';
        }
        else if (match = text.match(webpage)) {
            text = match[1] + '…';
        }

        console.log("Here?");
        return brandseye.utilities.restrictStringToLength(text, restriction);
    }

    /**
     * Marks bars with unknown and other classes.
     */
    function markUnknownAndOthers(selection, x, klass, extractor) {
        if (!klass) klass = '.nv-bar';
        if (!extractor) extractor = _.identity;
        selection.selectAll(klass).each(function(d) {
            d = extractor(d);
            var other = false,
                unknown = false;
            if (_(x(d)).isString()) {
                var lower = x(d).toLowerCase();
                other = lower === 'others';
                unknown = lower === 'unknown';
            }
            d3.select(this)
                .classed('other', other)
                .classed('unknown', unknown);
        });
    }

    function setupDispatcher(dispatch, container, originalDispatch, tooltipDispatch, originalData, selector, transformData) {
        if (_(transformData).isUndefined()) transformData = _.identity;
        console.log("originalDispatch", originalDispatch);
        originalDispatch.on('elementClick', function(data) {
            dispatch.elementClick(data);
        });

        tooltipDispatch.on('tooltipShow', function(data) {
            dispatch.tooltipShow(data);
        });

        tooltipDispatch.on('tooltipHide', function(data) {
            dispatch.tooltipHide(data);
        });

        container.selectAll(selector).on('mouseup', function(d) {
            var data = {
                point: transformData(d),
                e: d3.event,
                series: originalData[d.series]
            };
            if (d3.event.which == 2) dispatch.elementMiddleClick(data);
            if (d3.event.which == 3) dispatch.elementRightClick(data);
        });
    }

    function getOriginalData(selection) {
        var originalData = null;
        selection.each(function(d) {
            originalData = d;
        });

        return originalData;
    }

    //--------------------------------------------------------------
    // # Basic graph functionality

    // This defines the parent object from which most of the graphs descend.
    namespace.Graph = function() {
        // Javascript does not have a great way to provide member data
        // encapsulation. Here we're placing the member data in set called attributes.
        // Since we want the member data to be unique to each instance, we create it here
        // in the constructor, rather than below in the prototype.
        this.attributes = {
            colours: brandseye.colours.scheme,
            showLegend: true,
            coarseness: 'daily',
            padding: {left: 0, right: 0, bottom: 0, top: 0},
            dispatch: d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick', 'tooltipShow', 'tooltipHide'),
            labelFormat: d3.format(',.f'),
            showLabels: false
        };
        return this;
    };

    namespace.Graph.prototype = {

        render: function() {
            this.setup();

            var parent = d3.select(this.element());

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');
            var tickFormat = this.tickFormat();
            var padding = this.padding();
            var nvChart = this.attributes.nvChart;

            // Here we set up basic
            console.log("Data", this.data());
            var that = this;
            svg
                .datum(this.data())
                .transition()
                .duration(100)
                .call(function(selection) {

                    that.initialiseData();
                    that.arrangeLegend(selection);
                    var margins = that.calculateMargins(selection);

                    if (that.dataAxisLabel() && (that.labelPosition == "rows" || that.labelPosition == "columns")) {
                        var dataAxisLabelOffset = that.drawAxisDataLabel(selection, margins);
                        if (that.labelPosition == "columns") margins.left = (margins.left || 0) + dataAxisLabelOffset;
                        if (that.labelPosition == "rows") margins.bottom = (margins.bottom || 0) + dataAxisLabelOffset;
                    }

                    nvChart
                        .margin(margins)
                        .width(that.width())
                        .height(that.height())
                        .showLegend(false)
                        .x(that.x())
                        .y(that.y())
                        .noData(loadingText)
                        .tooltips(false)
                        .color(that.colours());

                    if (nvChart.reduceXTicks) nvChart.reduceXTicks(false);
                    if (nvChart.showControls) nvChart.showControls(false);
                    // For piecharts.
                    if (nvChart.showLabels) nvChart.showLabels(false);

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

                    console.log("FINISHED RENDERING");

                });
            return this;
        },

        setup: function() {
            if (!this.attributes.hasBeenSetup) {
                this.attributes.nvChart = this.createChart();
                this.attributes.legend = namespace.chartLegend();
                this.attributes.labels = namespace.chartLabel();
            }
            this.attributes.hasBeenSetup = true;
        },

        // Override this function to return an instance of the nvchart
        // that the child of *Graph* should use.
        createChart: function() {
            throw new Error("createChart not implemented");
        },

        // This method is meant to run through the data set and initialise any extra
        // values that might be needed, as well as determining the maximum length
        // of the labels.
        initialiseData: function() {
            var data = this.data();
            var maxLabelLength = 0;
            var tickFormat = this.tickFormat();

            if (data) {
                _(data).each(function(s, i) {
                    _(s.values).each(function(d) {
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

        drawAxisDataLabel: function(selection, margins) {
            var finalHeight = 0,
                orientation = this.labelPosition,
                label = this.dataAxisLabel(),
                width = this.width(),
                height = this.height();


            margins = _.extend({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
            }, margins || {});

            var data = this.data();
            if (data) {
                selection.each(function() {
                    var labelSelection = d3.select(this).selectAll('.data-label').data([label]);
                    labelSelection.enter()
                        .append('text')
                        .style('opacity', 0)
                        .classed('data-label', true);

                    labelSelection.text(label.long);
                    var bbox = labelSelection.node().getBBox();

                    if (bbox.width > (orientation === 'rows' ? (width - margins.left - margins.right) * 3/4 : (height - margins.bottom - margins.top) * 3/4)) {
                        labelSelection.text(label.short);
                        bbox = labelSelection.node().getBBox();
                    }

                    var x = 0,
                        y = 0;
                    var buffer = orientation == "columns" ? 5 : 0;
                    console.log("New Buffer is ", buffer, orientation);

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
                        .attr('transform', function() {
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

        preRenderXAxisTicks: function() {
            var nvChart = this.nvChart();
            if (nvChart.xAxis) {
                console.log("++++++++setting tick format");
                nvChart.xAxis.tickFormat(_.partial(xAxisTickFormat, xAxisRestriction));
            }
        },

        postRenderXAxisTicks: function() {
            var nvChart = this.nvChart();
            var container = d3.select(nvChart.container);
            var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
            xTicks.selectAll('text').classed('x-axis-label', true);

            overrideAxisLabels(xTicks, this.xAxisOverride());
            addTooltips(xTicks, this.xAxisTooltips());
        },

        preRenderYAxisTicks: function() {
            var nvChart = this.nvChart();
            if (nvChart.yAxis) {
                nvChart.yAxis
                    .tickFormat(this.tickFormat())
                    .showMaxMin(false);
            }
        },

        postRenderYAxisTicks: function() {
            var nvChart = this.nvChart();
            var container = d3.select(nvChart.container);
            var yTicks = container.select('.nv-y.nv-axis > g').selectAll('g');
            yTicks.selectAll('text').classed('y-axis-label', true);
            addTooltips(yTicks, this.tickFormat());
        },

        setupContainer: function() {
            var nvChart = this.nvChart();
            var xScale = nvChart.multibar.xScale();
            var yScale = nvChart.multibar.yScale();
            var container = d3.select(nvChart.container);

            container.classed('bm', true);

            container.selectAll('.chart-background').remove();
            container.select('.nv-wrap').insert('rect', ':first-child')
                .attr('class', 'chart-background')
                .attr('fill', backgroundColour)
                .attr('width', _(xScale.rangeExtent()).last())
                .attr('height', _(yScale.range()).first());
        },

        calculateLegendMargin: function() {
            return {top: 0, left: 60, right: this.width()};
        },

        arrangeLegend: function(selection) {
            this.attributes.legend
                .colours(this.colours())
                .margin(this.calculateLegendMargin())
                .height(this.height())
                .width(this.width())
                .showLegend(this.showLegend());
            selection.call(this.attributes.legend);
        },

        calculateMargins: function(selection) {
            var maxLabelLength = this.attributes.maxLabelLength || 0;

            var margins = {
                top:    30,
                bottom: (this.coarseness() === 'weekly' ? 45 : 40),
                left:   40,
                right:  20
            };

            var padding = this.padding();

            if (maxLabelLength) margins.left = (margins.left || 0) + maxLabelLength * 10;

            margins.left += padding.left;
            margins.right += padding.right;
            margins.bottom += padding.bottom;
            margins.top += padding.top;

            margins.bottom = margins.bottom + this.attributes.legend.finalHeight() + 20;

            return margins;
        },

        // Override to supply code that will arrange the axis bar ticks.
        arrangeTicks: function() {
            var xTicks = d3.select(this.nvChart().container).select('.nv-x.nv-axis > g').selectAll('g');
            xTicks.selectAll('.tick').style('opacity', 0);
        },

        arrangeLabels: function(selection) {
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
                .showLabels(this.showLabels());
            labels(selection);
        },

        labelPosition: "columns",

        //----------------------------------------
        // ## Getters and Setters
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

        // Sets the data to be displayed.
        data: function(_) {
            if (!arguments.length) return this.attributes.data;
            this.attributes.data = _;
            return this;
        },

        // Sets the element in which the graph should be displayed. This
        // should be native dom element (rather than a jquery or d3 selection).
        element: function(_) {
            if (!arguments.length) return this.attributes.element;
            this.attributes.element = _;
            return this;
        },

        nvChart: function() {
            return this.attributes.nvChart;
        },

        width: function(_) {
            if (!arguments.length) return this.attributes.width;
            this.attributes.width = _;
            return this;
        },

        height: function(_) {
            if (!arguments.length) return this.attributes.height;
            this.attributes.height = _;
            return this;
        },

        x: function(_) {
            if (!arguments.length) return this.attributes.x;
            this.attributes.x = _;
            return this;
        },

        y: function(_) {
            if (!arguments.length) return this.attributes.y;
            this.attributes.y = _;
            return this;
        },

        tickFormat: function(_) {
            if (!arguments.length) return this.attributes.tickFormat;
            this.attributes.tickFormat = _;
            return this;
        },

        labelFormat: function(_) {
            if (!arguments.length) return this.attributes.labelFormat;
            this.attributes.labelFormat = _;
            return this;
        },

        labelCompression: function(_) {
            if (!arguments.length) return this.attributes.labelCompression;
            this.attributes.labelCompression = _;
            return this;
        },

        showLabels: function(_) {
            if (!arguments.length) return this.attributes.showLabels;
            this.attributes.showLabels = _;
            return this;
        },

        labels: function() {
            return this.attributes.labels;
        },

        tooltip: function(_) {
            return this;
        },

        forceY: function(force) {
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

        xAxisTooltips: function(_) {
            if (!arguments.length) return this.attributes.xAxisTooltips;
            this.attributes.xAxisTooltips = _;
            return this;
        },

        xAxisOverride: function(_) {
            if (!arguments.length) return this.attributes.xAxisOverride;
            this.attributes.xAxisOverride = _;
            return this;
        },

        colourIndex: function(index) {
            this.colours(Beef.Colours.getScheme(index));
            return this;
        },

        colours: function(_) {
            if (!arguments.length) return this.attributes.colours;
            this.attributes.colours = _.concat(brandseye.colours.allColours);
            return this;
        },

        coarseness: function(_) {
            if (!arguments.length) return this.attributes.coarseness;
            this.attributes.coarseness = _;
            return this;
        },

        showLegend: function(_) {
            if (!arguments.length) return this.attributes.showLegend;
            this.attributes.showLegend = _;
            return this;
        },

        dataAxisLabel: function(_) {
            if (!arguments.length) return this.attributes.dataAxisLabel;
            this.attributes.dataAxisLabel = _;
            return this;
        },

        padding: function(_) {
            if (!arguments.length) return this.attributes.padding;
            this.attributes.padding = {
                top:    _.top || 0,
                bottom: _.bottom || 0,
                left:   _.left || 0,
                right:  _.right || 0
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
        dispatch: function() {
            return this.attributes.dispatch;
        },

        // Returns the [d3 dispatch](https://github.com/mbostock/d3/wiki/Internals#wiki-events) associated with
        // the underlying graph element
        graphDispatch: function() {
            var nvChart = this.nvChart();
            if (nvChart.multibar) return nvChart.multibar.dispatch;
            if (nvChart.pie) return nvChart.pie.dispatch;
            throw new Error("Unable to determine graph dispatch");
        },

        // This is the class of the item that should be interactive in the graph, such as bars or pie slices.
        interactiveClass: function() {
            return '.nv-bar';
        },

        dataTransform: function(data) {
            return data;
        }
    };

    //--------------------------------------------------------------
    // # Histograms
    // The histogram is useful for accumulating discrete values in to buckets,
    // such as for showing the number of mentions appearing over time.

    namespace.Histogram = function() {
        return this;
    };

    namespace.Histogram.prototype = new namespace.Graph();
    namespace.Histogram.prototype.createChart = function() { console.log("Histogram!!"); return nv.models.multiBarChart(); };

    namespace.Histogram.prototype.arrangeTicks = function() {
        var seen = false;
        var that = this;

        var container = d3.select(this.nvChart().container);
        var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
        var xScale = this.nvChart().multibar.xScale();

        var isMonday = function(m) {
            return m.day() === 1;
        };

        // Here, if there are comparisons, we want to map label dates to lists of comparison dates.
        var comparisons = {};
        if (that.data() && that.data().length > 1) {
            _(that.data()).each(function(s) {
                _(s.values).each(function(d) {
                    if (d.originalPublished) {
                        var dates = comparisons[d.published] || [];
                        dates.push(d.originalPublished);
                        comparisons[d.published] = dates;
                    }
                });
            });
        }

        // We don't want to include any duplicate dates.
        _(comparisons).each(function(dates, key) {
            comparisons[key] = _(dates).uniq();
        });

        xTicks
            .selectAll('text')
            .classed('x-axis-label', true)
            .each(function(data, position) {
                var m = new moment(data);
                var formatString = 'dddd, MMMM D, YYYY';

                // TODO There is a bug that makes the data and text elements repeat itself with position always
                // equal to 0. When this begins, data will be null.
                if (!data || seen) {
                    seen = true;
                    return;
                }

                // TODO sometimes we should rotate nothing, if the rangeBand is large enough.
                var rotate = xScale.rangeBand() / that.data().length < 20 ||
                    that.longFormat(m, position) || isMonday(m) ||
                    _(that.data()).any(function(d) { return d.values[0].published === data;});
                var angle = that.coarseness() === 'monthly' || that.coarseness() === 'weekly' ? -30 : -90;
                var yOffset = that.coarseness() === 'monthly' || that.coarseness() === 'weekly' ? 0 : 5;

                d3.select(this)
                    .style('text-anchor', rotate ? 'end' : 'middle')
                    .attr('class', function(d) {
                        if (!d || that.coarseness() !== 'daily') return "";

                        // Here we want to see if this is the beginning of a month
                        if (m.month() === 0 && m.date() === 1) return "year-begin";
                        if (m.date() == 1) return "month-begin";
                        if (m.day() == 1) return "week-begin";
                        return "standard-day";
                    })
                    .attr('transform', rotate ? 'translate (-10, ' + yOffset + ') rotate(' + angle + ' 0,0)' : '')
                    .append('title')
                    .text(function(d) {
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
                            .reduce(function(memo, date) {
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
                    .style('opacity', 0);
            }
        }

        xTicks.selectAll('.tick').style('opacity', 0);
    };

    namespace.Histogram.prototype.preRenderXAxisTicks = function() {
        var nvChart = this.nvChart();
        var that = this;

        if (nvChart.xAxis) {
            nvChart.xAxis.tickFormat(function(d, i) {
                if (!that.dateRegex.test(d)) return d;
                var m = new moment(d);

                switch (that.coarseness()) {
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

    namespace.Histogram.prototype.postRenderXAxisTicks = function() { };

    // Returns true if we should format this date long, rather than just
    // with the date.
    namespace.Histogram.prototype.longFormat = function(m, i) { return i === 0 || m.date() === 1; };
    namespace.Histogram.prototype.dateRegex = /^\d+-\d+-\d+$/;

    //--------------------------------------------------------------
    // # Bar charts
    // *Bar charts* are useful for comparing categories of things. Bar charts
    // are rendered horizontally: if you would like vertical bars, see the *ColumnChart*.

    namespace.BarChart = function() {
        return this;
    };

    namespace.BarChart.prototype = new namespace.Graph();
    namespace.BarChart.prototype.createChart = function() { console.log("barchart!!"); return nv.models.multiBarHorizontalChart(); };
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

    //--------------------------------------------------------------
    // # Column charts
    // *Column charts* are useful for comparing categories of things. Column charts
    // are rendered vertically: if you would like horizontal bars, see the *BarChart*.

    namespace.ColumnChart = function() {
        return this;
    };

    namespace.ColumnChart.prototype = new namespace.Graph();
    namespace.ColumnChart.prototype.createChart = function() { console.log("columnchart!!"); return nv.models.multiBarChart(); };

    namespace.ColumnChart.prototype.initialiseData = function() {
        var data = this.data();

        if (data) {
            var xAxisOverride = this.xAxisOverride(),
                x = this.x(),
                y = this.y(),
                tickFormat = this.tickFormat(),
                maxXLabelLength = 0,
                maxYLabelLength = 0;

            console.log("initialise DATA?", data);
            _(data).each(function(s, i) {
                _(s.values).each(function(d) {
                    // Store an index for legends.
                    d.legendKey = i;
                    console.log("TEST TEST TEST TEST");

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

    namespace.ColumnChart.prototype.postRenderXAxisTicks = function() {
        var nvChart = this.nvChart(),
            xAxisOverride = this.xAxisOverride(),
            container = d3.select(nvChart.container),
            xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');

        container.select('.nv-x.nv-axis > g').selectAll('g').selectAll('text')
            .filter(function(d) {
                return d != null && ((xAxisOverride && xAxisOverride[d] && xAxisOverride[d].length > 2) || d.toString().length > 2 )
            })
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-30 0,0)');

        overrideAxisLabels(xTicks, this.xAxisOverride());
        addTooltips(xTicks, this.xAxisTooltips());
    };

    namespace.ColumnChart.prototype.calculateLegendMargin = function() {
        return { top: 0, left: this.nvChart().margin().left, right: this.width() };
    };

    namespace.ColumnChart.prototype.calculateMargins = function() {
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

        console.log("MaxXLabel", maxXLabelLength, "maxY", maxYLabelLength);

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

    //--------------------------------------------------------------
    // # Pie charts

    namespace.PieChart = function() {
        return this;
    };

    namespace.PieChart.prototype = new namespace.Graph();
    namespace.PieChart.prototype.createChart = function() { console.log("piechart!!"); return nv.models.pieChart(); };
    namespace.PieChart.prototype.labelPosition = "circle";

    namespace.PieChart.prototype.initialiseData = function() {
        var data = this.data(),
            xAxisOverride = this.xAxisOverride(),
            x = this.x();

        if (data) {
            _(data).each(function(d) {
                _(d.values).each(function(d, i) {
                    d.legendKey = i;
                })
            });

            this.attributes.labelItems = _(data[0].values).map(function(d) {
                var item = x(d);
                if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                return { key: item };
            });
        }
    };

    namespace.PieChart.prototype.arrangeLegend = function(selection) {
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

    namespace.PieChart.prototype.setupContainer = function(selection) {
        d3.select(this.nvChart().container)
            .classed('bm', true);
    };

    namespace.PieChart.prototype.arrangeLabels = function(selection) {
        var labels = this.labels(),
            nvChart = this.nvChart();

        labels.x(this.x())
            .y(this.y())
            .width(this.width() - nvChart.margin().left - nvChart.margin().right)
            .height(this.height() - nvChart.margin().top - nvChart.margin().bottom)
            .format(this.labelFormat())
            .position("circle")
            .determineCompression(this.labelCompression())
            .showLabels(this.showLabels());
        labels(selection);
    };

    namespace.PieChart.prototype.interactiveClass = function() {
        return '.nv-slice';
    };

    namespace.PieChart.prototype.dataTransform = function(data) {
        return data.data;
    };

    //--------------------------------------------------------------
    // # Line charts

    namespace.LineChart = function() {
        return this;
    };

    namespace.LineChart.prototype = new namespace.Graph();
    namespace.LineChart.prototype.createChart = function() { console.log("linechart!!"); return nv.models.lineChart(); };

    //--------------------------------------------------------------

    /**
     * Use this to display a histogram against dates.
     */
    namespace.histogramChart = function() {

        //-------------------------------------

        //noinspection UnnecessaryLocalVariableJS
        var nvChart = nv.models.multiBarChart(),
            data,
            element,
            width,
            height,
            x,
            y,
            tickFormat = d3.format(',.f'),
            tooltip,
            forceMaxY,
            forceMinY,
            colours = Beef.Colours.getScheme(0),
            legend = namespace.chartLegend(),
            coarseness = 'daily',
            labels = namespace.chartLabel(),
            labelFormat = d3.format(',.f'),
            labelCompression,
            showLegend = true,
            showLabels = false,
            padding = {left: 0, right: 0, bottom: 0, top: 0},
            dataAxisLabel;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the chart. It takes
         * a D3 selection and returns itself.
         */
        function chart(selection) {
            // Returns true if we should format this date long, rather than just
            // with the date.
            var longFormat = function(m, i) {
                return i === 0 || m.date() === 1;
            };

            var dateRegex = /^\d+-\d+-\d+$/;

            var isMonday = function(m) {
                return m.day() === 1;
            };

            var margins = {
                top:    30,
                bottom: (coarseness === 'weekly' ? 45 : 40),
                left:   40,
                right:  20
            };

            var maxLabelLength = 0;
            selection.each(function(data) {
                if (data) {
                    _(data).each(function(s, i) {
                        _(s.values).each(function(d) {
                            d.legendKey = i;
                            var length = tickFormat(d).length;
                            if (length > maxLabelLength) {
                                maxLabelLength = length;
                            }
                        });
                    });
                }
            });

            if (maxLabelLength) margins.left = (margins.left || 0) + maxLabelLength * 10;

            margins.left += padding.left;
            margins.right += padding.right;
            margins.bottom += padding.bottom;
            margins.top += padding.top;

            // Put up legends
            legend
                .colours(colours)
                .margin({top: 0, left: 60, right: width})
                .height(height)
                .width(width)
                .showLegend(showLegend);
            selection.call(legend);
            margins.bottom = margins.bottom + legend.finalHeight() + 20;

            if (dataAxisLabel) {
                margins.left = (margins.left || 0) + drawAxisDataLabel(selection, dataAxisLabel, margins, width, height, 'column');
            }

            nvChart
                .margin(margins)
                .width(width)
                .height(height)
                .showControls(false)
                .showLegend(false)
                .reduceXTicks(false)
                .x(x)
                .y(y)
                .noData(loadingText)
                .tooltips(false)
                .color(colours);

            nvChart.xAxis
                .tickFormat(xAxisTickFormat);

            if (forceMaxY) nvChart.multibar.forceY([forceMinY, forceMaxY]);

            nvChart.xAxis.tickFormat(function(d, i) {
                if (!dateRegex.test(d)) return d;
                var m = new moment(d);

                switch (coarseness) {
                    case 'daily':
                        if (longFormat(m, i)) return m.format("MMM DD");
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

            nvChart.yAxis
                .tickFormat(tickFormat)
                .showMaxMin(false);

            // Call the chart.
            nvChart(selection);

            if (tooltip) {
                nvChart.dispatch.on('tooltipShow', function(e) {
                    Beef.Tooltip.show({
                        template: tooltip.template,
                        templateHelpers: tooltip.templateHelpers,
                        target: e.e.currentTarget,
                        model: tooltip.data(nvChart, e)
                    })
                })
                nvChart.dispatch.on('tooltipHide', function() {
                    Beef.Tooltip.close();
                })
            }

            // Get the original data.
            var originalData = getOriginalData(selection);

            // Here, if there are comparisons, we want to map label dates to lists of comparison dates.
            var comparisons = {};
            if (originalData && originalData.length > 1) {
                _(originalData).each(function(s) {
                    _(s.values).each(function(d) {
                        if (d.originalPublished) {
                            var dates = comparisons[d.published] || [];
                            dates.push(d.originalPublished);
                            comparisons[d.published] = dates;
                        }
                    });
                });
            }

            // We don't want to include any duplicate dates.
            _(comparisons).each(function(dates, key) {
                comparisons[key] = _(dates).uniq();
            });

            var xScale = nvChart.multibar.xScale();
            var yScale = nvChart.multibar.yScale();
            var container = d3.select(nvChart.container);

            container.classed('bm', true);

            container.selectAll('.chart-background').remove();
            container.select('.nv-wrap').insert('rect', ':first-child')
                .attr('class', 'chart-background')
                .attr('fill', backgroundColour)
                .attr('width', _(xScale.rangeExtent()).last())
                .attr('height', _(yScale.range()).first());

            // Now we want to rotate and translate the labels appropriately.
            var seen = false;
            var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
            xTicks
                .selectAll('text')
                .classed('x-axis-label', true)
                .each(function(data, position) {
                    var m = new moment(data);
                    var formatString = 'dddd, MMMM D, YYYY';

                    // TODO There is a bug that makes the data and text elements repeat itself with position always
                    // equal to 0. When this begins, data will be null.
                    if (!data || seen) {
                        seen = true;
                        return;
                    }

                    // TODO sometimes we should rotate nothing, if the rangeBand is large enough.
                    var rotate = xScale.rangeBand() / originalData.length < 20 ||
                        longFormat(m, position) || isMonday(m) ||
                        _(originalData).any(function(d) { return d.values[0].published === data;});
                    var angle = coarseness === 'monthly' || coarseness === 'weekly' ? -30 : -90;
                    var yOffset = coarseness === 'monthly' || coarseness === 'weekly' ? 0 : 5;

                    d3.select(this)
                        .style('text-anchor', rotate ? 'end' : 'middle')
                        .attr('class', function(d) {
                            if (!d || coarseness !== 'daily') return "";

                            // Here we want to see if this is the beginning of a month
                            if (m.month() === 0 && m.date() === 1) return "year-begin";
                            if (m.date() == 1) return "month-begin";
                            if (m.day() == 1) return "week-begin";
                            return "standard-day";
                        })
                        .attr('transform', rotate ? 'translate (-10, ' + yOffset + ') rotate(' + angle + ' 0,0)' : '')
                        .append('title')
                        .text(function(d) {
                            if (_(comparisons).isEmpty() || !comparisons[d]) {
                                switch (coarseness) {
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
                                .reduce(function(memo, date) {
                                    return memo + "\nvs\n" + new moment(date).format(format);
                                }, first)
                                .value();
                        });
                });

            if (originalData) {
                if (xScale.rangeBand() < 12) {
                    xTicks.selectAll('text')
                        .classed('smaller-text', true);
                }
                if (xScale.rangeBand() < 10) {
                    xTicks.selectAll('.standard-day')
                        .style('opacity', 0);
                }
            }

            xTicks.selectAll('.tick').style('opacity', 0);

            labels.x(x)
                .y(y)
                .width(width - nvChart.margin().left - nvChart.margin().right)
                .height(height)
                .xScale(nvChart.multibar.xScale())
                .yScale(nvChart.multibar.yScale())
                .delay(nvChart.delay())
                .format(labelFormat)
                .position("columns")
                .determineCompression(labelCompression)
                .showLabels(showLabels);
            labels(selection);

            setupDispatcher(chart, container, nvChart.multibar.dispatch, originalData, '.nv-bar');

            chart.nvChart = nvChart;
            return chart;
        }

        //-------------------------------------

        chart.render = function() {
            var parent = d3.select(this.element());

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');

            svg
                .datum(this.data())
                .transition()
                .duration(100)
                .call(this);
            return chart;
        };

        //-------------------------------------

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick');

        chart.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return chart;
        };

        chart.element = function(_) {
            if (!arguments.length) return element;
            element = _;
            return chart;
        };

        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };

        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };

        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };

        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };

        chart.tickFormat = function(_) {
            if (!arguments.length) return tickFormat;
            tickFormat = _;
            return chart;
        };

        chart.labelFormat = function(_) {
            if (!arguments.length) return labelFormat;
            labelFormat = _;
            return chart;
        };

        chart.labelCompression = function(_) {
            if (!arguments.length) return labelCompression;
            labelCompression = _;
            return chart;
        };

        chart.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return chart;
        };

        chart.labels = function() {
            return labels;
        }

        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };

        chart.forceY = function(force) {
            if (!arguments.length) return [forceMinY, forceMaxY];
            if (_.isArray(force)) {
                forceMinY = force[0];
                forceMaxY = force[1];
            }
            else {
                forceMinY = 0;
                forceMaxY = force;
            }
            return chart;
        };

        chart.xAxisTooltips = function(_) {
            return chart;
        };

        chart.xAxisOverride = function(_) {
            return chart;
        };

        chart.colourIndex = function(index) {
            chart.colours(Beef.Colours.getScheme(index));
            return chart;
        };

        chart.colours = function(_) {
            if (!arguments.length) return colours;
            colours = _.concat(Beef.Colours.allColours);
            return chart;
        };

        chart.coarseness = function(_) {
            if (!arguments.length) return coarseness;
            coarseness = _;
            return chart;
        };

        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };

        chart.dataAxisLabel = function(_) {
            if (!arguments.length) return dataAxisLabel;
            dataAxisLabel = _;
            return chart;
        };

        chart.padding = function(p) {
            if (!arguments.length) return padding;
            padding = _.extend({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
            }, p || {});
            return chart;
        };

        //-------------------------------------

        return chart;
    };


    //-----------------------------------------------------------------
    //-----------------------------------------------------------------
    /**
     * Use this to display a linechart
     */
    namespace.lineChart = function() {

        //-------------------------------------

        //noinspection UnnecessaryLocalVariableJS
        var nvChart = nv.models.lineChart(),
            data,
            element,
            width,
            height,
            x,
            y,
            tickFormat = d3.format(',.f'),
            tooltip,
            forceMaxY,
            forceMinY,
            colours = Beef.Colours.getScheme(0),
            legend = namespace.chartLegend(),
            coarseness = 'daily',
            labels = namespace.chartLabel(),
            labelFormat = d3.format(',.f'),
            labelCompression,
            showLegend = true,
            showLabels = false,
            padding = {left: 0, right: 0, bottom: 0, top: 0},
            dataAxisLabel;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the chart. It takes
         * a D3 selection and returns itself.
         */
        function chart(selection) {
            // Returns true if we should format this date long, rather than just
            // with the date.
            var longFormat = function(m, i) {
                return i === 0 || m.date() === 1;
            };

            var dateRegex = /^\d+-\d+-\d+$/;

            var isMonday = function(m) {
                return m.day() === 1;
            };

            var margins = {
                top:    30,
                bottom: (coarseness === 'weekly' ? 45 : 40),
                left:   40,
                right:  20
            };

            var maxLabelLength = 0;
            selection.each(function(data) {
                if (data) {
                    _(data).each(function(s, i) {
                        _(s.values).each(function(d) {
                            d.legendKey = i;
                            var length = tickFormat(d).length;
                            if (length > maxLabelLength) {
                                maxLabelLength = length;
                            }
                        });
                    });
                }
            });

            if (maxLabelLength) margins.left = (margins.left || 0) + maxLabelLength * 10;

            margins.left += padding.left;
            margins.right += padding.right;
            margins.bottom += padding.bottom;
            margins.top += padding.top;

            // Put up legends
            legend
                .colours(colours)
                .margin({top: 0, left: 60, right: width})
                .height(height)
                .width(width)
                .showLegend(showLegend);
            selection.call(legend);
            margins.bottom = margins.bottom + legend.finalHeight() + 20;

            if (dataAxisLabel) {
                margins.left = (margins.left || 0) + drawAxisDataLabel(selection, dataAxisLabel, margins, width, height, 'column');
            }

            // Get the original data and handle timestamps for the linechart.
            var chartX = x;
            var originalData = null;

            selection.each(function(data) {
                originalData = data;
                _(data).each(function(s) {
                    _(s.values).each(function(d) {
                        if (_(d.published).isString() || _(d.date).isString()) {
                            d.publishedStamp =  new moment(d.published ? d.published : d.date).unix();
                            chartX = null;
                        }
                    })
                });
            });

            if (chartX === null) {
                chartX = function(d) {
                    return d.publishedStamp;
                }
            }

            nvChart
                .margin(margins)
                .width(width)
                .height(height)
                .showLegend(false)
                .x(chartX)
                .y(y)
                .noData(loadingText)
                .tooltips(false)
                .color(colours);

            nvChart.xAxis
                .tickFormat(xAxisTickFormat);

            if (forceMaxY) nvChart.forceY([forceMinY, forceMaxY]);


            var scale = d3.time.scale();
            nvChart.xScale(scale);

            nvChart.xAxis.tickFormat(function(d, i) {
                if (!dateRegex.test(d) && chartX === x) return d;
                var m = chartX === x ? new moment(d) : moment.unix(d);
                return m.format("MMM DD");
            });

            nvChart.yAxis
                .tickFormat(tickFormat)
                .showMaxMin(false);

            nvChart(selection);

            if (tooltip) {
                nvChart.dispatch.on('tooltipShow', function(e) {
                    Beef.Tooltip.show({
                        template: tooltip.template,
                        templateHelpers: tooltip.templateHelpers,
                        target: d3.event.currentTarget,
                        model: tooltip.data(nvChart, e)
                    })
                })
                nvChart.dispatch.on('tooltipHide', function() {
                    Beef.Tooltip.close();
                })
            }

            // Here, if there are comparisons, we want to map label dates to lists of comparison dates.
            var comparisons = {};
            if (originalData && originalData.length > 1) {
                _(originalData).each(function(s) {
                    _(s.values).each(function(d) {
                        if (d.originalPublished) {
                            var dates = comparisons[d.published] || [];
                            dates.push(d.originalPublished);
                            comparisons[d.published] = dates;
                        }
                    });
                });
            }

            // We don't want to include any duplicate dates.
            _(comparisons).each(function(dates, key) {
                comparisons[key] = _(dates).uniq();
            });

            // Now we want to rotate and translate the labels appropriately.
            var seen = false;
            var container = d3.select(nvChart.container);

            container.classed('bm', true);

            var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
            xTicks
                .selectAll('text')
                .classed('x-axis-label', true)
                .each(function(data, position) {
                    var m = chartX === x ? new moment(data) : moment.unix(data);
                    var formatString = 'dddd, MMMM D, YYYY';

                    // TODO There is a bug that makes the data and text elements repeat itself with position always
                    // equal to 0. When this begins, data will be null.
                    if (!data || seen) {
                        seen = true;
                        return;
                    }

                    // TODO sometimes we should rotate nothing, if the rangeBand is large enough.
                    var angle = -30;
                    var yOffset = 0;

                    d3.select(this)
                        .style('text-anchor', 'end')
                        .attr('transform', 'translate (-20, ' + yOffset + ') rotate(' + angle + ' 0,0)')
                        .append('title')
                        .text(function(d) {
                            if (_(comparisons).isEmpty() || !comparisons[d]) {
                                return m.format(formatString);
                            }
                            var dates = comparisons[d];
                            var format = 'ddd MMM D, YYYY';
                            var first = new moment(dates[0]).format(format);
                            return _(comparisons[d]).chain()
                                .drop(1)
                                .reduce(function(memo, date) {
                                    return memo + "\nvs\n" + new moment(date).format(format);
                                }, first)
                                .value();
                        });
                });

            xTicks.selectAll('.tick').style('opacity', 0);

            container.selectAll('.nv-axisMaxMin text').each(function (data, position) {
                d3.select(this)
                    .style('text-anchor', 'end')
                    .attr('transform', 'rotate(-30, 0,0)');
            });


            setupDispatcher(chart, container, nvChart.lines.dispatch, originalData, '.nv-bar');

            chart.nvChart = nvChart;
            return chart;
        }

        //-------------------------------------

        chart.render = function() {
            console.log(this.element());
            var parent = d3.select(this.element());

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');

            svg
                .datum(this.data())
                .transition()
                .duration(100)
                .call(this);
            return chart;
        };

        //-------------------------------------

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.lines.dispatch;

        chart.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return chart;
        };

        chart.element = function(_) {
            if (!arguments.length) return element;
            element = _;
            return chart;
        };

        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };

        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };

        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };

        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };

        chart.tickFormat = function(_) {
            if (!arguments.length) return tickFormat;
            tickFormat = _;
            return chart;
        };

        chart.labelFormat = function(_) {
            if (!arguments.length) return labelFormat;
            labelFormat = _;
            return chart;
        };

        chart.labelCompression = function(_) {
            if (!arguments.length) return labelCompression;
            labelCompression = _;
            return chart;
        };

        chart.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return chart;
        };

        chart.labels = function() {
            return labels;
        }

        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };

        chart.forceY = function(force) {
            if (!arguments.length) return [forceMinY, forceMaxY];
            if (_.isArray(force)) {
                forceMinY = force[0];
                forceMaxY = force[1];
            }
            else {
                forceMinY = 0;
                forceMaxY = force;
            }
            return chart;
        };

        chart.xAxisTooltips = function(_) {
            return chart;
        };

        chart.xAxisOverride = function(_) {
            return chart;
        };

        chart.colourIndex = function(index) {
            chart.colours(Beef.Colours.getScheme(index));
            return chart;
        };

        chart.colours = function(_) {
            if (!arguments.length) return colours;
            colours = _.concat(Beef.Colours.allColours);
            return chart;
        };

        chart.coarseness = function(_) {
            if (!arguments.length) return coarseness;
            coarseness = _;
            return chart;
        };

        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };

        chart.dataAxisLabel = function(_) {
            if (!arguments.length) return dataAxisLabel;
            dataAxisLabel = _;
            return chart;
        };

        chart.padding = function(p) {
            if (!arguments.length) return padding;
            padding = _.extend({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
            }, p || {});
            return chart;
        };

        //-------------------------------------

        return chart;
    };

    //-----------------------------------------------------------------
    //-----------------------------------------------------------------

    /**
     * Draws a horizontal bar chart.
     */
    namespace.barChart = function() {

        //-------------------------------------

        //noinspection UnnecessaryLocalVariableJS
        var nvChart = nv.models.multiBarHorizontalChart(),
            data,
            element,
            width,
            height,
            x,
            y,
            showLabels = true,
            labels = namespace.chartLabel(),
            legend = namespace.chartLegend(),
            showLegend = true,
            tickFormat = d3.format(',.f'),
            labelFormat = d3.format(',.f'),
            labelCompression,
            tooltip,
            forceMaxY,
            forceMinY,
            xAxisOverride,
            xAxisTooltips,
            colours = Beef.Colours.getScheme(0),
            padding = {left: 0, right: 0, bottom: 0, top: 0},
            dataAxisLabel;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the chart. It takes
         * a D3 selection and returns itself.
         */
        function chart(selection) {
            // We want to figure out how much size the x-axis text (on the left side of the chart)
            // requires to fit nicely.
            var margins = {left: 30, right: 30, top: 20, bottom: 20};
            var maxLabelLength = 0;
            var xAxisRestriction = 25;

            selection.each(function(data) {
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
            });

            // Put up legends
            legend
                .colours(colours)
                .margin({top: 0, left: 30, right: width})
                .height(height)
                .width(width)
                .showLegend(showLegend);
            selection.call(legend);
            margins.bottom = (margins.bottom || 0) + legend.finalHeight() + 20;

            if (maxLabelLength) {
                margins.left = maxLabelLength * 8; // Budgeting a set pixel width per letter (innacurate because not-fixed width font in use)
            }

            if (dataAxisLabel) {
                margins.bottom += drawAxisDataLabel(selection, dataAxisLabel, margins, width, height);
            }

            margins.left += padding.left;
            margins.right += padding.right;
            margins.bottom += padding.bottom;
            margins.top += padding.top;

            nvChart
                .margin(margins)
                .width(width)
                .height(height)
                .showControls(false)
                .showLegend(false)
                .x(x)
                .y(y)
                .noData(loadingText)
                .color(colours)
                .tooltips(false);

            if (forceMaxY) nvChart.multibar.forceY([forceMinY, forceMaxY]);

            nvChart.yAxis
                .tickFormat(tickFormat)
                .showMaxMin(false);

            nvChart.xAxis
                .tickFormat(_.partial(xAxisTickFormat, xAxisRestriction));

            // Call the chart.
            nvChart(selection);

            if (tooltip) {
                nvChart.dispatch.on('tooltipShow', function(e) {
                    Beef.Tooltip.show({
                        template: tooltip.template,
                        templateHelpers: tooltip.templateHelpers,
                        target: e.e.currentTarget,
                        model: tooltip.data(nvChart, e)
                    })
                })
                nvChart.dispatch.on('tooltipHide', function() {
                    Beef.Tooltip.close();
                })
            }

            var container = d3.select(nvChart.container);
            container.classed('bm', true);

            // Add some tooltips
            var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
            var yTicks = container.select('.nv-y.nv-axis > g').selectAll('g');

            xTicks.selectAll('text').classed('x-axis-label', true);

            overrideAxisLabels(xTicks, xAxisOverride);
            addTooltips(xTicks, xAxisTooltips);
            addTooltips(yTicks, tickFormat);

            d3.select(nvChart.container)
                .select('.nv-x.nv-axis > g')
                .selectAll('.tick')
                .style('opacity', 0);

            var xScale = nvChart.multibar.xScale();
            var yScale = nvChart.multibar.yScale();
            container.selectAll('.chart-background').remove();
            container.select('.nv-wrap').insert('rect', ':first-child')
                .attr('class', 'chart-background')
                .attr('fill', backgroundColour)
                .attr('height', _(xScale.rangeExtent()).last())
                .attr('width', _(yScale.range()).last());

            markUnknownAndOthers(selection, x);

            labels.x(x)
                .y(y)
                .width(width - nvChart.margin().left - nvChart.margin().right)
                .height(height)
                .xScale(nvChart.multibar.xScale())
                .yScale(nvChart.multibar.yScale())
                .delay(nvChart.delay())
                .format(labelFormat)
                .position("rows")
                .determineCompression(labelCompression)
                .showLabels(showLabels);

            labels(selection);

            setupDispatcher(chart, container, nvChart.multibar.dispatch, getOriginalData(selection), '.nv-bar');

            return chart;
        }

        //-------------------------------------

        chart.render = function() {
            console.log(this.element());
            var parent = d3.select(this.element());

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');

            svg
                .datum(this.data())
                .transition()
                .duration(100)
                .call(this);
            return chart;
        };

        //-------------------------------------

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.multibar.dispatch;

        chart.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return chart;
        };

        chart.element = function(_) {
            if (!arguments.length) return element;
            element = _;
            return chart;
        };

        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };

        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };

        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };

        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };

        chart.tickFormat = function(_) {
            if (!arguments.length) return tickFormat;
            tickFormat = _;
            return chart;
        };

        chart.labelFormat = function(_) {
            if (!arguments.length) return labelFormat;
            labelFormat = _;
            return chart;
        };

        chart.labelCompression = function(_) {
            if (!arguments.length) return labelCompression;
            labelCompression = _;
            return chart;
        };

        chart.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return chart;
        };

        chart.labels = function() {
            return labels;
        }

        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };

        chart.forceY = function(force) {
            if (!arguments.length) return [forceMinY, forceMaxY];
            if (_.isArray(force)) {
                forceMinY = force[0];
                forceMaxY = force[1];
            }
            else {
                forceMinY = 0;
                forceMaxY = force;
            }
            return chart;
        };

        chart.xAxisTooltips = function(_) {
            if (!arguments.length) return xAxisTooltips;
            xAxisTooltips = _;
            return chart;
        };

        chart.xAxisOverride = function(_) {
            if (!arguments.length) return xAxisOverride;
            xAxisOverride = _;
            return chart;
        };

        chart.colourIndex = function(index) {
            chart.colours(Beef.Colours.getScheme(index));
            return chart;
        };

        chart.colours = function(_) {
            if (!arguments.length) return colours;
            colours = _.concat(Beef.Colours.allColours);
            return chart;
        };

        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };

        chart.dataAxisLabel = function(_) {
            if (!arguments.length) return dataAxisLabel;
            dataAxisLabel = _;
            return chart;
        };

        chart.padding = function(p) {
            if (!arguments.length) return padding;
            padding = _.extend({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
            }, p || {});
            return chart;
        };

        chart.coarseness = function(_) {
            return chart;
        };

        //-------------------------------------

        return chart;
    };


    //-------------------------------------

    /**
     * Draws a vertical column chart.
     */
    namespace.columnChart = function() {

        //-------------------------------------

        //noinspection UnnecessaryLocalVariableJS
        var nvChart = nv.models.multiBarChart(),
            data,
            element,
            width,
            height,
            x,
            y,
            showLabels = true,
            labels = namespace.chartLabel(),
            legend = namespace.chartLegend(),
            showLegend = true,
            tickFormat = d3.format(',.f'),
            labelFormat = d3.format(',.f'),
            labelCompression,
            tooltip,
            forceMaxY,
            forceMinY,
            xAxisTooltips,
            xAxisOverride,
            colours = Beef.Colours.getScheme(0),
            padding = {left: 0, right: 0, bottom: 0, top: 0},
            dataAxisLabel;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the chart. It takes
         * a D3 selection and returns itself.
         */
        function chart(selection) {

            var margins = nv.models.multiBarChart().margin();
            var maxXLabelLength = 0,
                maxYLabelLength = 0;
            selection.each(function(data) {
                if (data) {
                    _(data).each(function(s, i) {
                        _(s.values).each(function(d) {
                            // Store an index for legends.
                            d.legendKey = i;

                            // Determine length for x axis
                            var item = x(d);
                            if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                            var length = xAxisTickFormat(defaultLabelRestriction, item.toString()).length;
                            if (length > maxXLabelLength) {
                                maxXLabelLength = length;
                            }

                            // Determine length for y axis
                            item = tickFormat(y(d));
                            length = item.toString().length
                            if (length > maxYLabelLength) {
                                maxYLabelLength = length;
                            }
                        });
                    });
                }
            });

            legend
                .colours(colours)
                .margin({top: 0, left: nvChart.margin().left, right: width})
                .height(height)
                .width(width)
                .showLegend(showLegend);
            selection.call(legend);
            margins.bottom = (margins.bottom || 0) + legend.finalHeight();

            if (maxXLabelLength) {
                // Budgeting a set pixel width per letter (innacurate because not-fixed width font in use)
                // This may be an odd number because the labels are rotated.
                margins.bottom = (margins.bottom || 0) + maxXLabelLength * 3;
            }

            if (maxYLabelLength) {
                margins.left = (margins.left || 0) + maxYLabelLength * 3;
            }

            if (dataAxisLabel) {
                margins.left = (margins.left || 0) + drawAxisDataLabel(selection, dataAxisLabel, margins, width, height, 'column');
            }

            margins.left += padding.left;
            margins.right += padding.right;
            margins.bottom += padding.bottom;
            margins.top += padding.top;

            nvChart
                .margin(margins)// We need more space for the rotated / translated x-axis labels.
                .width(width)
                .height(height)
                .showControls(false)
                .showLegend(false)
                .reduceXTicks(false)
                .x(x)
                .y(y)
                .noData(loadingText)
                .color(colours)
                .tooltips(false);

            if (forceMaxY) nvChart.multibar.forceY([forceMinY, forceMaxY]);

            nvChart.yAxis
                .tickFormat(tickFormat)
                .showMaxMin(false);
            nvChart.xAxis
                .tickFormat(_.partial(xAxisTickFormat, defaultLabelRestriction));

            // Call the chart.
            nvChart(selection);

            if (tooltip) {
                nvChart.dispatch.on('tooltipShow', function(e) {
                    Beef.Tooltip.show({
                        template: tooltip.template,
                        templateHelpers: tooltip.templateHelpers,
                        target: e.e.currentTarget,
                        model: tooltip.data(nvChart, e)
                    })
                });
                nvChart.dispatch.on('tooltipHide', function() {
                    Beef.Tooltip.close();
                })
            }


            var container = d3.select(nvChart.container);
            container.classed('bm', true);

            var xScale = nvChart.multibar.xScale();
            var yScale = nvChart.multibar.yScale();

            container.selectAll('.chart-background').remove();
            container.select('.nv-wrap').insert('rect', ':first-child')
                .attr('class', 'chart-background')
                .attr('fill', backgroundColour)
                .attr('width', _(xScale.rangeExtent()).last())
                .attr('height', _(yScale.range()).first());

            // Now we want to rotate and translate the labels appropriately.
            var xTicks = container.select('.nv-x.nv-axis > g').selectAll('g');
            var yTicks = container.select('.nv-y.nv-axis > g').selectAll('g');
            xTicks
                .selectAll('text')
                .classed('x-axis-label', true)
                .filter(function(d) {
                    return d != null && ((xAxisOverride && xAxisOverride[d] && xAxisOverride[d].length > 2) || d.toString().length > 2 )
                })
                .style('text-anchor', 'end')
                .attr('transform', 'rotate(-30 0,0)');

            xTicks.selectAll('.tick').style('opacity', 0);

            // Add some tooltips
            overrideAxisLabels(xTicks, xAxisOverride);
            addTooltips(xTicks, xAxisTooltips);
            addTooltips(yTicks, tickFormat);

            markUnknownAndOthers(selection, x);


            // Labels.
            labels.x(x)
                .y(y)
                .width(width)
                .height(height)
                .xScale(nvChart.multibar.xScale())
                .yScale(nvChart.multibar.yScale())
                .delay(nvChart.delay())
                .format(labelFormat)
                .scale(true)
                .determineCompression(labelCompression)
                .showLabels(showLabels);

            labels(selection);

            setupDispatcher(chart, container, nvChart.multibar.dispatch, getOriginalData(selection), '.nv-bar');

            return chart;
        }

        //-------------------------------------

        chart.render = function() {
            console.log(this.element());
            var parent = d3.select(this.element());

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');

            svg
                .datum(this.data())
                .transition()
                .duration(100)
                .call(this);
            return chart;
        };

        //-------------------------------------

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.multibar.dispatch;

        chart.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return chart;
        };

        chart.element = function(_) {
            if (!arguments.length) return element;
            element = _;
            return chart;
        };

        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };

        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };

        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };

        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };

        chart.tickFormat = function(_) {
            if (!arguments.length) return tickFormat;
            tickFormat = _;
            return chart;
        };

        chart.labelFormat = function(_) {
            if (!arguments.length) return labelFormat;
            labelFormat = _;
            return chart;
        };

        chart.labelCompression = function(_) {
            if (!arguments.length) return labelCompression;
            labelCompression = _;
            return chart;
        };

        chart.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return chart;
        };

        chart.labels = function() {
            return labels;
        }

        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };

        chart.forceY = function(force) {
            if (!arguments.length) return [forceMinY, forceMaxY];
            if (_.isArray(force)) {
                forceMinY = force[0];
                forceMaxY = force[1];
            }
            else {
                forceMinY = 0;
                forceMaxY = force;
            }
            return chart;
        };

        chart.xAxisTooltips = function(_) {
            if (!arguments.length) return xAxisTooltips;
            xAxisTooltips = _;
            return chart;
        };

        chart.xAxisOverride = function(_) {
            if (!arguments.length) return xAxisOverride;
            xAxisOverride = _;
            return chart;
        };

        chart.colourIndex = function(index) {
            chart.colours(Beef.Colours.getScheme(index));
            return chart;
        };

        chart.colours = function(_) {
            if (!arguments.length) return colours;
            colours = _.concat(Beef.Colours.allColours);
            return chart;
        };

        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };

        chart.dataAxisLabel = function(_) {
            if (!arguments.length) return dataAxisLabel;
            dataAxisLabel = _;
            return chart;
        };

        chart.padding = function(p) {
            if (!arguments.length) return padding;
            padding = _.extend({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
            }, p || {});
            return chart;
        };

        chart.coarseness = function(_) {
            return chart;
        };

        //-------------------------------------

        return chart;
    };

    //-------------------------------------

    /**
     * Draws a pie chart.
     */
    namespace.pieChart = function() {

        //-------------------------------------

        var nvChart = nv.models.pieChart(),
            data,
            element,
            width,
            height,
            x,
            y,
            xAxisOverride,
            tooltip,
            legend = namespace.chartLegend(),
            labels = namespace.chartLabel(),
            labelFormat = d3.format(',.f'),
            showLabels,
            labelCompression,
            colours = Beef.Colours.getScheme(0),
            padding = {left: 0, right: 0, bottom: 0, top: 0},
            showLegend = true;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the chart. It takes
         * a D3 selection and returns itself.
         */
        function chart(selection) {

            var margins = {left: 0, right: 0, top: 0, bottom: 0};
            var labelItems = null;

            selection.each(function(data, i, j) {
                if (data) {
                    _(data).each(function(d) {
                        _(d.values).each(function(d, i) {
                            d.legendKey = i;
                        })
                    });

                    labelItems = _(data[0].values).map(function(d) {
                        var item = x(d);
                        if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                        return { key: item };
                    });
                }
            });

            // Put up legends
            legend
                .data(labelItems)
                .colours(colours)
                .margin({top: 0, left: 30, right: width})
                .height(height)
                .width(width)
                .showLegend(showLegend)
                .forceLegend(true);
            selection.call(legend);
            margins.bottom = (margins.bottom || 0) + legend.finalHeight();

            margins.left += padding.left;
            margins.right += padding.right;
            margins.bottom += padding.bottom;
            margins.top += padding.top;

            nvChart
                .margin(margins)
                .width(width)
                .height(height)
                .x(x)
                .y(y)
                .showLegend(false)
                .showLabels(false)
                .tooltips(false)
                .color(colours)
                .noData(loadingText);

            // Call the chart.
            nvChart(selection);

            selection.each(function() {
                d3.select(this).classed('bm', true);
            });

            if (tooltip) {
                nvChart.dispatch.on('tooltipShow', function(e) {
                    Beef.Tooltip.show({
                        positions: ['top-right', 'top-left'],
                        template: tooltip.template,
                        templateHelpers: tooltip.templateHelpers,
                        target: d3.event.currentTarget,
                        model: tooltip.data(nvChart, e)
                    })
                });
                nvChart.dispatch.on('tooltipHide', function() {
                    Beef.Tooltip.close();
                })
            }

            markUnknownAndOthers(selection, x, '.nv-slice', function(d) { return d.data; });

            labels.x(x)
                .y(y)
                .width(width - nvChart.margin().left - nvChart.margin().right)
                .height(height - nvChart.margin().top - nvChart.margin().bottom)
                .format(labelFormat)
                .position("circle")
                .determineCompression(labelCompression)
                .showLabels(showLabels);
            labels(selection);

            setupDispatcher(chart, d3.select(nvChart.container), nvChart.pie.dispatch, getOriginalData(selection), '.nv-slice', function(data) { return data.data; });

            chart.nvChart = nvChart;
            return chart;
        }

        //-------------------------------------

        chart.render = function() {
            console.log(this.element());
            var parent = d3.select(this.element());

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');

            svg
                .datum(this.data())
                .transition()
                .duration(100)
                .call(this);
            return chart;
        };

        //-------------------------------------

        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.pie.dispatch;

        chart.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return chart;
        };

        chart.element = function(_) {
            if (!arguments.length) return element;
            element = _;
            return chart;
        };

        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };

        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };

        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };

        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };

        /* To provide a common interface */
        chart.tickFormat = function(_) {
            return chart;
        };

        /* To provide a common interface */
        chart.labelFormat = function(_) {
            if (!arguments.length) return labelFormat;
            labelFormat = _;
            return chart;
        };

        chart.labelCompression = function(_) {
            if (!arguments.length) return labelCompression;
            labelCompression = _;
            return chart;
        };

        chart.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return chart;
        };

        chart.labels = function() {
            return labels;
        }

        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };

        chart.forceY = function(_) {
            // Used to provide a consistent interface.
            return chart;
        };

        chart.xAxisTooltips = function(_) {
            return chart;
        };

        chart.xAxisOverride = function(_) {
            if (!arguments.length) return xAxisOverride;
            xAxisOverride = _;
            return chart;
        };

        chart.colourIndex = function(index) {
            chart.colours(Beef.Colours.getScheme(index));
            return chart;
        };

        chart.colours = function(_) {
            if (!arguments.length) return colours;
            colours = _.concat(Beef.Colours.allColours);
            return chart;
        };

        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };

        chart.dataAxisLabel = function(_) {
            return chart;
        };

        chart.padding = function(p) {
            if (!arguments.length) return padding;
            padding = _.extend({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
            }, p || {});
            return chart;
        };

        chart.coarseness = function(_) {
            return chart;
        };

        //-------------------------------------

        return chart;
    };


    //-------------------------------------

    /**
     * Places labels on a chart. Currently this supports row and column charts, by
     * setting the position() field to be 'rows' or 'columns'. You can also format
     * how the label will appear by setting the format function.
     */
    namespace.chartLabel = function() {

        var x,
            y,
            xScale,
            yScale,
            delay,
            width,
            height,
            format = _.identity,
            position = "columns",
            scale = false,
            determineCompression,
            showLabels = true,
            duration = 500,
            originalSelection;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the labels. It takes
         * a D3 selection and returns itself.
         */
        function draw(selection) {
            originalSelection = selection;

            selection.each(function(data) {
                var length = data ? data.length : 1;

                var yDiff = -8             // Space between label and bar.
                var slideDiff = -15;        // The space that new labels slide in over.
                var anchor = 'middle';      // Where text is anchored to relative to its length.
                var baseline = 'auto';      // Where text is anchored relative to its height.
                var getY = function(d) {
                    return yScale(y(d)) + yDiff;
                };
                var getX = function(d, i, j) {
                    // We are attempting to fit the label in the middle of its bar, or its section
                    // of the bar if there are series.
                    return xScale(x(d)) + (j * 2 + 1) * xScale.rangeBand() / (2 * length);
                };

                // Here we set things up slightly differently for handling rows.
                // The default values above handle columns.
                if (position == 'rows') {
                    var tmp = getY;
                    getY = getX;
                    getX = tmp;

                    anchor = 'start';
                    yDiff = -yDiff;
                    baseline = 'central';
                }

                if (data) {
                    // Labels are divided into planes, one plane of comment per series of data.
                    // Here we add and remove planes as necessary.
                    var labelPlanes = d3.select(this).select('.nv-wrap').selectAll('.label-plane').data(data);
                    labelPlanes.exit().remove();
                    labelPlanes.enter().append('g')
                        .attr('class', 'label-plane');

                    // Labels occur on a plane. Here we subselect data from a plane. We then add and remove labels
                    // as necessary.
                    var labels = labelPlanes
                        .selectAll('.chart-label')
                        .data(function(d) { return d.values; });
                    labels.exit().remove();

                    // Add new 'blank' labels.
                    labels.style('opacity', 0);
                    labels.enter().append('text')
                        .classed('chart-label', true)
                        .attr('text-anchor', anchor)
                        .attr('dx', slideDiff)
                        .attr('dominant-baseline', baseline)
                        .style('opacity', 0)
                        .transition()
                        .delay(500)
                        .duration(duration)
                        .attr('dx', 0);

                    if (position === 'circle') setupCircleLabels(labels)
                    else setupBarLabels(labels, length, getX, getY, anchor, yDiff);

                    // Hide them or animate them fading in.
                    labels
                        .transition()
                        .delay(750)
                        .duration(duration)
                        .style('opacity', showLabels ? 1 : 0);
                }
            });

            return draw;
        }

        //------------------------------

        function setupCircleLabels(labels) {
            // Calculate beginning and end angles.
            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return y(d); })
            var radius = (Math.min(width, height) / 2) * 0.85;

            function calcAngle(d) {
                return (d.endAngle - d.startAngle) / 2.0 + d.startAngle;
            }

            labels.data(function(d) { return pie(d.values); });
            labels
                .each(function(d) {
                    d.angle = calcAngle(d);
                })
                .style('text-anchor', function(d) {
                    // Anchor depends on the side of the pie that the text appears on.
                    if (d.angle < Math.PI/8 || d.angle > 2 * Math.PI - Math.PI/8) return 'middle';
                    if ((d.angle > (Math.PI - Math.PI/8)) && (d.angle < (Math.PI + Math.PI/8))) return 'middle';
                    return 0 < d.angle && d.angle < Math.PI ? "start" : "end";
                })
                .style('dominant-baseline', function(d) {
                    // We want labels on the bottom half of the pie chart to hang,
                    // and those on the top to use their lower baseline.
                    if ((d.angle > (Math.PI/8 + Math.PI/2)) && (d.angle < (2 * Math.PI - Math.PI/8 - Math.PI/2))) return 'hanging';
                    return Math.PI/2 < d.angle && d.angle < 3/2 * Math.PI ? 'middle' : 'auto';
                })
                .text(function(d) {
                    var angle = (d.endAngle - d.startAngle);
                    return angle > 0.15 ? format(y(d.data)) : '';
                })
                .attr('transform', function(d) {
                    var xPos  = radius * Math.cos(d.angle  - Math.PI/2.0),
                        yPos  = radius * Math.sin(d.angle  - Math.PI/2.0);
                    return 'translate (' + (xPos + width/2) + ', ' + (yPos + height/2) + ')';
                });
        }

        //------------------------------

        /**
         * This is used to determine if we should scale text.
         * If we are drawing series data, the range should be contracted a bit.
         */
        function calculateRangeBuffer(length) {
            return length > 1 ? 0.95 : 1.05;
        };

        function setupBarLabels(labels, length, getX, getY, anchor, yDiff) {
            var rangeBuffer = calculateRangeBuffer(length);

            var rangeBand = xScale.rangeBand() * rangeBuffer,
                availableSpace = rangeBand / length,
                compression = 0;
            if (determineCompression) {
                labels.each(function(d) {
                    var tmp = determineCompression(y(d), availableSpace);
                    if (compression == null || tmp > compression) compression = tmp;
                });
            }

            labels
                .text(function(d) { return format(y(d), compression); })
                .classed('small-label', false)  // Need to make sure this is removed, so that we get proper sizing.
                .style('text-anchor', function(d) {
                    // We have enough space to flip the text into the bar.
                    if (d.toString().length * 8 < getX(d)) return 'end';
                    else return anchor;
                })
                .attr('x', function(d) {
                    // Text has been flipped. Shift it slightly the other way.
                    if (d.toString().length * 8 < getX(d)) return getX.apply(this, arguments) - 2 * yDiff;
                    else return getX.apply(this, arguments);
                })
                .attr('y', getY);

            // Now that the labels have their text set, lets scale
            // them to fit the rangeBand.

            var removeLabels = _.once(function() {
                var remove = false;
                labels.each(function() {
                    if (!remove) {
                        var bounds = this.getBBox();
                        var size = position == "columns" ? bounds.width : bounds.height;
                        remove = remove || size > availableSpace;
                    }
                });
                if (remove) labels.remove();
            })

            if (scale) {
                _.delay(function(){
                    // An initial pass to see if we should shrink text. The visibility
                    // test is to ensure we don't have an NS_ERROR_FAILURE on requesting the bounding box.
                    var shrink = false;
                    labels.each(function() {
                        if (!shrink && $(this).is(':visible')) {
                            var bounds = this.getBBox();
                            shrink = shrink || bounds.width > availableSpace;
                        }
                    });
                    labels.classed('small-label', shrink);

                    removeLabels();
                }, 500);
            }
            else {
                removeLabels();
            }
        }

        //-------------------------------------

        draw.show = function() {
            originalSelection.each(function(data) {
                d3.select(this).selectAll('.chart-label')
                    .transition()
                    .duration(duration)
                    .style('opacity', 1);
            })
        };

        draw.hide = function(time) {
            if (_(time).isUndefined()) time = duration;
            originalSelection.each(function(data) {
                d3.select(this).selectAll('.chart-label')
                    .transition()
                    .duration(time)
                    .style('opacity', 0);
            })
        };

        draw.isSpaceForLabels = function() {
            originalSelection.each(function(data) {
                if (!data) return true;

                var length = data.length,
                    availableSpace = calculateRangeBuffer(length) / length,
                    shrink = false;

                d3.select(this).selectAll('.chart-label').each(function() {
                    if (!shrink) {
                        var bounds = this.getBBox();
                        shrink = shrink || bounds.width > availableSpace;
                    }
                });
            });
        };

        //-------------------------------------

        draw.position = function(_) {
            if (!arguments.length) return position;
            position = _;
            return draw;
        };

        draw.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            return draw;
        };

        draw.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return draw;
        };

        draw.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return draw;
        };

        draw.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return draw;
        };

        draw.delay = function(_) {
            if (!arguments.length) return delay;
            delay = _;
            return draw;
        };

        draw.xScale = function(_) {
            if (!arguments.length) return xScale;
            xScale = _;
            return draw;
        };

        draw.yScale = function(_) {
            if (!arguments.length) return yScale;
            yScale = _;
            return draw;
        };

        /**
         * Passes two possible arguments. The first is the data that should be formatted. The second
         * is an indiciation of the amount of compression that should occur, as determined by the
         * determineCompression function.
         */
        draw.format = function(_) {
            if (!arguments.length) return format;
            format = _;
            return draw;
        };

        /**
         * This function should return a numeric indication of how much compression the label format
         * should incur. This number needs to be meaningful only to the label format function.
         * Larger numbers, however, should mean smaller compression.
         */
        draw.determineCompression = function(_) {
            if (!arguments.length) return determineCompression;
            determineCompression = _;
            return draw;
        };

        /*
         * Whether we should scale labels to fit.
         */
        draw.scale = function(_) {
            if (!arguments.length) return scale;
            scale = _;
            return draw;
        };

        draw.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return draw;
        };

        return draw;
    };


    //--------------------------------------------------------


    namespace.chartLegend = function() {

        //-------------------------------------

        var margin = {top: 0, left: 0, right: 180},
            colours,
            finalHeight = 0,
            width,
            height,
            data,
            forceLegend,
            showLegend = true;


        function draw(selection) {

            var padding = 10;
            var afterRectPadding = 2;
            var bottomPadding = 5;
            var topPadding = 15;
            var lineHeight = 10;
            var interLinePadding = 5;
            var x = 0;
            var y = 0;


            selection.each(function(d) {
                if (d) {
                    var legend = d3.select(this).selectAll('.legend').data([data || d]);

                    if ((!forceLegend && (data || d).length <= 1) || !showLegend) {
                        finalHeight = 0;
                        legend.remove();
                        return;
                    }

                    legend.enter()
                        .append('g')
                        .classed('legend', true);
                    legend.exit().remove();

                    var entries = legend.selectAll('.legend-entry').data(function(d) { return d; });
                    entries.exit().remove();

                    var newEntries = entries.enter();
                    newEntries.append('g')
                        .classed('legend-entry', true)
                        .each(function() {
                            var item = d3.select(this);
                            item
                                .append('rect')
                                .attr('width', 10)
                                .attr('height', 10)
                                .attr('rx', 2)
                                .attr('ry', 2);
                            item
                                .append('text')
                                .attr('dx', 10 + afterRectPadding)
                                .attr('dy', 10);
                            item
                                .append('title');
                        })
                        .on('mouseover', function(d, i) {  // This highlights the item that we are mousing over.
                            selection.each(function() {
                                d3.select(this).selectAll('.nv-slice')
                                    .classed('bar-fade', function(d) { return d.data.legendKey != i; });

                                d3.select(this).selectAll('.nv-bar')
                                    .classed('bar-fade', function(d) { return d.legendKey != i; })
                                    .classed('bar-highlight', function(d) { return d.legendKey == i; });

                                d3.select(this).selectAll('.chart-label')
                                    .classed('bar-fade', function(d) {
                                        if (d.data) return d.data.legendKey != i;
                                        return d.legendKey != i;
                                    });
                            })
                        })
                        .on('mouseout', function(d, i) {
                            selection.each(function() {
                                d3.select(this).selectAll('.nv-slice')
                                    .classed('bar-highlight', false)
                                    .classed('bar-fade', false);
                                d3.select(this).selectAll('.nv-bar')
                                    .classed('bar-highlight', false)
                                    .classed('bar-fade', false);
                                d3.select(this).selectAll('.chart-label')
                                    .classed('bar-fade', false);
                            })
                        })
                        .style('opacity', 0)
                        .transition()
                        .duration(750)
                        .style('opacity', 1);

                    entries.each(function(d, i) {
                        d3.select(this)
                            .select('rect')
                            .style('fill', function() {
                                if (colours) return d.color || colours[i % colours.length];
                                else return d.color || 'black';
                            });
                    })

                    // This index and odd data indexing is needed because d3 is only returning an index of 0, and has not
                    // properly updated the data for these subelements.
                    var index = 0;
                    entries.selectAll('text')
                        .text(function() { return xAxisTickFormat(30, (data || d)[index++].key.toString().removeQuotes()); })

                    index = 0
                    entries.selectAll('title')
                        .text(function() { return (data || d)[index++].key.toString().removeQuotes() });

                    // Now we want to lay out the legend in columns. So we will
                    // first determine the longest entry.
                    var maxWidth = 0;
                    entries.each(function() {
                        var width = d3.select(this).node().getBBox().width;
                        if (width > maxWidth) maxWidth = width;
                    });

                    maxWidth += padding;

                    var availableWidth = width - margin.left;
                    var numColumns = Math.floor(availableWidth / maxWidth);
                    maxWidth += Math.floor((availableWidth % maxWidth) / numColumns) // Divide the left over space between the items.

                    if (maxWidth === Infinity) maxWidth = width;

                    var currentColumn = 0;
                    entries
                        .attr('transform', function(d, i) {
                            var currentX = currentColumn * maxWidth,
                                currentY = y;

                            currentColumn += 1;
                            if (currentColumn >= numColumns) {
                                currentColumn = 0;
                                y = y + lineHeight + interLinePadding;
                            }

                            return 'translate (' + currentX + ',' + currentY + ')';
                        });

                    finalHeight = y + lineHeight + bottomPadding;
                    legend
                        .attr('transform', 'translate(' + margin.left + ',' + (height - finalHeight) + ')');
                    finalHeight += topPadding;
                }
            });

            return draw;
        }

        //-------------------------------------

        draw.margin = function(_) {
            if (!arguments.length) return margin;
            margin = _;
            return draw;
        };

        draw.colours = function(_) {
            if (!arguments.length) return colours;
            colours = _.concat(Beef.Colours.allColours);
            return draw;
        };

        draw.finalHeight = function(_) {
            return finalHeight;
        };

        draw.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return draw;
        };

        draw.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return draw;
        };

        draw.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return draw;
        }

        draw.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return draw;
        };

        draw.forceLegend = function(_) {
            if (!arguments.length) return forceLegend;
            forceLegend = _;
            return draw;
        };

        //--------------

        return draw;
    };

    /**
     * Adds a sparkline to the given selector object.
     */
    namespace.Sparkline = function(selector, data, x, y) {
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
            .classed('chart-sparkline', true);

        var minX = x(_(data).min(x));
        var maxX = x(_(data).max(x));
        var minY = y(_(data).min(y));
        var maxY = y(_(data).max(y));

        var xScale = d3.scale.linear().domain([minX, maxX]).range([0, width]);
        var yScale = d3.scale.linear().domain([minY, maxY]).range([height, 0]);

        var line = d3.svg.line()
            .x(function(d) {
                return xScale(x(d));
            })
            .y(function(d) {
                return yScale(y(d));
            })
            .interpolate('linear');

        var lines = svg.selectAll('.bm-chart-sparkline-line').data([data]);
        lines.exit().remove();
        lines.enter().append('path').classed('bm-chart-sparkline-line', true);

        lines.attr('d', line);
    };

    namespace.Area = function(selector, data, x, y) {
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
            .classed('chart-sparkline', true);

        var minX = x(_(data).min(x));
        var maxX = x(_(data).max(x));
        var minY = y(_(data).min(y));
        var maxY = y(_(data).max(y));

        var xScale = d3.scale.linear().domain([minX, maxX]).range([0, width]);
        var yScale = d3.scale.linear().domain([minY, maxY]).range([height, 0]);

        var area = d3.svg.area()
            .x(function(d) {
                return xScale(x(d));
            })
            .y0(height)
            .y1(function(d) {
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

    return namespace;
}();