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

// BrandsEye Metrics is a simple library to help with two things:
// 1. Charting. It does this by building on top of [D3][d3] and [nvd3.js][nvd3].
// 2. Pulling data from a BrandsEye account.
//
// BrandsEye is an online platform for social media analysis.
// It provides an API for accessing the data programmatically, and this library is well suited
// for displaying that data. Indeed, most of the charts in the BrandsEye application are built on top of this
// library.
//
// [d3]: http://www.d3js.org
// [nvd3]: http://nvd3.org/


// The namespace does it all. All contained within.
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

    var attrs = {
        text: ['font-family', 'font-size', 'font-weight', 'color', 'text-anchor', 'fill',
            'stroke', 'stroke-width', 'stroke-opacity', 'line-height'],
        path: ['stroke', 'stroke-width', 'stroke-opacity', 'shape-rendering', 'fill', 'fill-opacity'],
        rect: ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity'],
        g: ['opacity'],
        line: ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'shape-rendering']
    };

    var inlineSvgCss = function(e) {
        var todo = attrs[e.prop("tagName")];
        if (todo) {
            for (var i = 0; i < todo.length; i++) {
                var attr = todo[i];
                var v = e.css(attr);
                if (v) e.css(attr, v);
            }
        }
        var list = e.children();
        for (i = 0; i < list.length; i++) inlineSvgCss($(list[i]));
    };

    return {
        // Restricts the length of a string to the given size. This should cut text
        // at word boundaries, and provide ellipses.
        restrictStringToLength: function(text, length) {
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
                return result.substring(0, length - 1) + '…';
            }

            return result.join('');
        },

        // Given an svg element, this will return an xml representation of that
        // element, including have CSS styles embedded in to the xml.
        convertSvgElementToXml: function(svg) {
            var width = svg.width();
            var height = svg.height();

            // add namespace and size to the svg so it will render properly
            svg.attr('xmlns', "http://www.w3.org/2000/svg");
            svg.attr('width', width);
            svg.attr('height', height);
            svg.attr('version', "1.1");

            // put in computed styles for lots of things so css is not needed
            inlineSvgCss(svg);

            var xml = svg.parent().html().trim();
            xml = xml.replace(/ class="[^"]+"/g, '');
            // the extra space after some of the translate's breaks canvg and maybe some other stuff
            xml = xml.replace(/ transform="translate \(/g, ' transform="translate(');
            // Remove empty clip-path specifications, which batik does not like
            xml = xml.replace(/clip-path=""/g, '');
            // Some paths are degenerate, and we remove their d value. Batik complains otherwise
            xml = xml.replace(/d="MZ"/g, '');
            return xml;
        },


        // This removes either single or double quotes from a string.
        // If quoteChar is not specified and the first character of the string is a ' or " then this is used.
        // It will also unescape things that have been escaped inside of the string. Strings that are not quoted are
        // returned as-is.
        removeQuotes: function(text, quoteChar) {
            var n = text.length - 1;
            if (n <= 0) return text;

            if (!quoteChar) {
                quoteChar = text.charAt(0);
                if (quoteChar != '"' && quoteChar != "'") return text;
            } else if (text.charAt(0) != quoteChar) {
                return text;
            }
            if (text.charAt(n) != quoteChar) return text;

            var i = text.indexOf("\\", 1);
            if (i < 0) return text.substring(1, n);
            var o = text.substring(1, i);
            for (; i < n; ) {
                var c = text.charAt(i++);
                if (c == '\\') c = text.charAt(i++);
                o += c;
            }
            return o;
        }
    }
}();

brandseye.charts = function() {

    var namespace = {
        version: "0.0.2"
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

    var backgroundColour = '#f8f8f8';
    var defaultLabelRestriction = 15;
    var xAxisRestriction = 25;
    var loadingText = '';
    var dateRegex = /^\d+-\d+-\d+$/;

    /**
     * Attempts to limit the text of x-axis labels to an appropriate length.
     * It tries to do this with some level of aesthetic awareness, by first
     * reducing text from the kinds of labels it recognises (such as unwanted
     * information from twitter and facebook, or web urls).
     */
    function xAxisTickFormat(restriction, text) {
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
    namespace.Graph = function() {
        return this;
    };

    namespace.Graph.prototype = {

        // Javascript does not have a great way to provide member data
        // encapsulation. Here we're placing the member data in set called attributes.
        // Since we want the member data to be unique to each instance, we create it here
        // in the constructor, rather than below in the prototype.
        createAttributes: function() {
            this.attributes = {
                data: [],
                width: 250,
                height: 250,
                duration: 250,
                x: function(d) { return d.x; },
                y: function(d) { return d.y; },
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

        render: function() {
            console.log("BEGINNING TO RENDER!!!!", this.constructor);
            this.setup();

            // TODO We already have parent, which is likely the same as container used everywhere.
            var parent = d3.select(this.element());
            console.log("The parent is", parent);

            if (parent.selectAll('svg').empty()) {
                parent.append('svg');
            }

            var svg = parent.select('svg');
            console.log("SVG is", svg);
            var nvChart = this.attributes.nvChart;

            // Here we set up basic
            var that = this;
            svg
                .datum(this.getDataToSet())
                .transition()
                .duration(this.duration())
                .call(function(selection) {

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

        // Most of the charts will want to set data in the default format.
        // Some, like the piechart, expect the data formatted slightly
        // differently. This is a great way to do whatever work needs to be done in
        // formatting and setting the data on the chart.
        getDataToSet: function() {
            return this.data();
        },

        drawAxisDataLabel: function(selection, margins) {
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
                selection.each(function() {
                    var labelSelection = d3.select(this).selectAll('.data-label').data([label]);
                    labelSelection.enter()
                        .append('text')
                        .style('opacity', zeroOpacity)
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

        setupChart: function(margins) {
            var nvChart = this.nvChart();

            console.log("Setting width", this.width(), "height", this.height());
            console.log("Setting margins", margins);
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

        preRenderXAxisTicks: function() {
            var nvChart = this.nvChart();
            if (nvChart.xAxis) {
                // nvChart.xAxis.tickFormat(_.partial(xAxisTickFormat, xAxisRestriction));
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
            var height = Math.max.apply(Math.max, yScale.range()),
                width = _(xScale.rangeExtent()).last();

            // In this case, our width and height values have been swapped.
            // This happens, for instance, when rendering bar charts.
            if (yScale.range()[0] == 0) {
                var tmp = height;
                height = width;
                width = tmp;
            }

            container.classed('bm', true);

            container.selectAll('.chart-background').remove();
            container.select('.nv-wrap').insert('rect', ':first-child')
                .attr('class', 'chart-background')
                .attr('fill', backgroundColour)
                .attr('width', width)
                .attr('height', height);
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

        defaultMargins: function() {
            return {
                top:    30,
                bottom: (this.coarseness() === 'weekly' ? 45 : 40),
                left:   40,
                right:  20
            };
        },

        calculateMargins: function(selection) {
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

        defaultMarginBottom: function() {
            return 20;
        },

        // Override to supply code that will arrange the axis bar ticks.
        arrangeTicks: function() {
            d3.select(this.nvChart().container)
                .select('.nv-x.nv-axis > g')
                .selectAll('g')
                .selectAll('.tick > line')
                .style('opacity', this.zeroOpacity());
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
                .zeroOpacity(this.zeroOpacity())
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

        // ### Setting the data
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
        data: function(data) {
            if (!arguments.length) return this.attributes.data;
            if (data && !data.length) data = [data];
            if (data && data[0].key === undefined) {
                data = [{
                    key: "series 1",
                    values: data
                }];
            }

            this.attributes.data = data || [];
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
            console.log("Height has been set to ", this.attributes.height);
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

        // By default, the library will use an opacity of zero to make things
        // invisible. Unfortunately, in some situations (for instance, when
        // using this library in jsdom) this opacity value is not always applied properly.
        // In that case, you can choose a custom value to use here.
        zeroOpacity: function(_) {
            if (!arguments.length) return this.attributes.zeroOpacity;
            this.attributes.zeroOpacity = _;
            return this;
        },

        duration: function(_) {
            if (!arguments.length) return this.attributes.duration;
            this.attributes.duration = _;
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
            if (nvChart.lines) return nvChart.lines.dispatch;
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
        namespace.Graph.prototype.createAttributes.call(this);
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
                    .style('opacity', that.zeroOpacity());
            }
        }

        xTicks.selectAll('.tick > line').style('opacity', this.zeroOpacity());
    };

    namespace.Histogram.prototype.preRenderXAxisTicks = function() {
        var nvChart = this.nvChart();
        var that = this;

        if (nvChart.xAxis) {
            nvChart.xAxis.tickFormat(function(d, i) {
                if (!dateRegex.test(d)) return d;
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

    //--------------------------------------------------------------
    // # Bar charts
    // *Bar charts* are useful for comparing categories of things. Bar charts
    // are rendered horizontally: if you would like vertical bars, see the *ColumnChart*.

    namespace.BarChart = function() {
        namespace.Graph.prototype.createAttributes.call(this);
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
        namespace.Graph.prototype.createAttributes.call(this);
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

            _(data).each(function(s, i) {
                _(s.values).each(function(d) {
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
        namespace.Graph.prototype.createAttributes.call(this);
        return this;
    };

    namespace.PieChart.prototype = new namespace.Graph();
    namespace.PieChart.prototype.createChart = function() { console.log("piechart!!"); return nv.models.pieChart(); };
    namespace.PieChart.prototype.labelPosition = "circle";

    namespace.PieChart.prototype.getDataToSet = function() {
        var data = this.data();
        if (data && data.length) return this.data()[0].values;
        else return data;
    };

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

            if (data && data.length) {
                this.attributes.labelItems = _(data[0].values).map(function(d) {
                    var item = x(d);
                    if (xAxisOverride && xAxisOverride[item]) item = xAxisOverride[item];
                    return { key: item };
                });
            }
            else this.attributes.labelItems = [];

        }
    };

    namespace.PieChart.prototype.defaultMargins = function() {
        return { top: 0, bottom: 0, left: 0, right: 0 }
    };

    namespace.PieChart.prototype.defaultMarginBottom = function() {
        return 0;
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
            .zeroOpacity(this.zeroOpacity())
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
    // This shows timeseries data. Expects the x-axis to show dates.

    namespace.LineChart = function() {
        namespace.Graph.prototype.createAttributes.call(this);
        return this;
    };

    namespace.LineChart.prototype = new namespace.Graph();
    namespace.LineChart.prototype.createChart = function() { console.log("linechart!!"); return nv.models.lineChart(); };

    namespace.LineChart.prototype.setupContainer = function() { };
    namespace.LineChart.prototype.arrangeLabels = function() { };

    namespace.LineChart.prototype.initialiseData = function() {
        namespace.Graph.prototype.initialiseData.apply(this);
        var data = this.data();
        var chartX = this.x();
        var rewriteX = false;

        _(data).each(function(s) {
            _(s.values).each(function(d) {
                if (_(chartX(d)).isString()) {
                    d.publishedStamp =  new moment(chartX(d)).unix();
                    rewriteX = true;
                }
            })
        });

        if (rewriteX) {
            chartX = function(d) {
                return d.publishedStamp;
            }
        }

        this.attributes.chartX = chartX;
    };

    namespace.LineChart.prototype.setupChart = function(margins) {
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

    namespace.LineChart.prototype.preRenderXAxisTicks = function() {
        var chartX = this.attributes.chartX,
            x = this.x();

        this.nvChart().xAxis.tickFormat(function(d, i) {
            if (!dateRegex.test(d) && chartX === x) return d;
            var m = chartX === x ? new moment(d) : moment.unix(d);
            return m.format("MMM DD");
        });
    };
    namespace.LineChart.prototype.postRenderXAxisTicks = function() {};

    namespace.LineChart.prototype.arrangeTicks = function() {
        var data = this.data(),
            nvChart = this.nvChart(),
            chartX = this.attributes.chartX,
            x = this.x();

        var comparisons = {};
        if (data && data.length > 1) {
            _(data).each(function(s) {
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

        xTicks.selectAll('.tick > line').style('opacity', this.zeroOpacity());

        container.selectAll('.nv-axisMaxMin text').each(function (data, position) {
            d3.select(this)
                .style('text-anchor', 'end')
                .attr('transform', 'rotate(-30, 0,0)');
        });
    };

    //--------------------------------------------------------------

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
            originalSelection,
            zeroOpacity = 0;

        //-------------------------------------

        /**
         * The function that does the actual rendering of the labels. It takes
         * a D3 selection and returns itself.
         */
        function draw(selection) {
            originalSelection = selection;

            selection.each(function(data) {
                if (data && data.length && !data[0].values) data = [ {values: data} ];
                var length = data ? data.length : 1;

                var yDiff = -8;             // Space between label and bar.
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
                    labels.style('opacity', zeroOpacity);
                    labels.enter().append('text')
                        .classed('chart-label', true)
                        .attr('text-anchor', anchor)
                        .attr('dx', slideDiff)
                        .attr('dominant-baseline', baseline)
                        .style('opacity', zeroOpacity)
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
                        .style('opacity', showLabels ? 1 : zeroOpacity);
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
        }

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
            });

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
            d3.select(originalSelection.node())
                .selectAll('.chart-label')
                .transition()
                .duration(duration)
                .style('opacity', 1);

        };

        draw.hide = function(time) {
            if (_(time).isUndefined()) time = duration;
            d3.select(originalSelection.node())
                .selectAll('.chart-label')
                .transition()
                .duration(time)
                .style('opacity', zeroOpacity);
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

        draw.zeroOpacity = function(_) {
            if (!arguments.length) return zeroOpacity;
            zeroOpacity = _;
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
            showLegend = true,
            zeroOpacity = 0;


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
                        .on('mouseover', function(d, i) {  // This highlights the item that we are mousing over.
                            // The selection object seems to have been damaged here. If we only use the original
                            // selection, then d3 begins to complain about undefined functions. So we reselect
                            // the element that it was pointing to.
                            var s = d3.select(selection.node());
                            s.selectAll('.nv-slice')
                                .classed('bar-fade', function(d) { return d.data.legendKey != i; });

                            s.selectAll('.nv-bar')
                                .classed('bar-fade', function(d) { return d.legendKey != i; })
                                .classed('bar-highlight', function(d) { return d.legendKey == i; });

                            s.selectAll('.chart-label')
                                .classed('bar-fade', function(d) {
                                    if (d.data) return d.data.legendKey != i;
                                    return d.legendKey != i;
                                });
                        })
                        .on('mouseout', function(d, i) {
                            var s = d3.select(selection.node());
                            s.selectAll('.nv-slice')
                                .classed('bar-highlight', false)
                                .classed('bar-fade', false);
                            s.selectAll('.nv-bar')
                                .classed('bar-highlight', false)
                                .classed('bar-fade', false);
                            s.selectAll('.chart-label')
                                .classed('bar-fade', false);
                        })
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
                        .style('opacity', zeroOpacity)
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
                        .text(function() { return xAxisTickFormat(30, brandseye.utilities.removeQuotes((data || d)[index++].key.toString())); });

                    index = 0;
                    entries.selectAll('title')
                        .text(function() { return brandseye.utilities.removeQuotes((data || d)[index++].key.toString()); });

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
            colours = _.concat(brandseye.colours.allColours);
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
        };

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

        draw.zeroOpacity = function(_) {
            if (!arguments.length) return zeroOpacity;
            zeroOpacity = _;
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

    // # Getting data to show

    // The address of the BrandsEye API server is https://api.brandseye.com. This is a restful,
    // json api. You can visit the page to view the documentation on the api. When asked for a username / password,
    // you can use your, you can use the username API_KEY and use your api key as the password.
    namespace.brandsEyeApi = "https://api.brandseye.com";

    // This is a helper function to load data from the api. You very likely would want
    // to only use this when testing the library, as it will expose your api key in your
    // client side code.
    //
    // The function takes two arguments.
    // - username: username for accessing the data server
    // - password: password for accessing the data server
    // - server: an optional argument for the server to use. If not filled in, the default BrandsEye API server will be used.
    // - key: An api key to use instead of a username/password pair
    namespace.loadFromApi = function(options) {
        if (!options.account && !options.fragment) {
            throw new Error("Please specify an account");
        }

        var username = options.username || "API_KEY",
            password = options.password || options.key,
            server = options.server || namespace.brandsEyeApi,
            callback = options.success,
            authorisation = "Basic " + btoa(username + ":" + password),
            fragment = options.fragment || "rest/accounts/" + options.account + "/mentions/count";

        var url = server + "/" + fragment + "?Authorization=" + authorisation;

        return $.ajax({
            url: url,
            contentType: "application/json",
            dataType: 'jsonp',
            success: callback,
            error: function() {
                alert("ERROR");
            }
        });
    };

    return namespace;
}();