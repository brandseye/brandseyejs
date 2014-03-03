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
    var loadingText = '';

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

        return text.restrictToLength(restriction);
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

    function setupDispatcher(chart, container, originalDispatch, originalData, selector, transformData) {
        if (_(transformData).isUndefined()) transformData = _.identity;
        originalDispatch.on('elementClick', function(data) {
            chart.dispatch.elementClick(data);
        });

        container.selectAll(selector).on('mouseup', function(d) {
            var data = {
                point: transformData(d),
                e: d3.event,
                series: originalData[d.series]
            };
            if (d3.event.which == 2) chart.dispatch.elementMiddleClick(data);
            if (d3.event.which == 3) chart.dispatch.elementRightClick(data);
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
    //--------------------------------------------------------------

    /**
     * Use this to display a histogram against dates.
     */
    namespace.histogramChart = function() {

        //-------------------------------------

        //noinspection UnnecessaryLocalVariableJS
        var nvChart = nv.models.multiBarChart(),
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

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick');

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

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.lines.dispatch;

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

            overrideAxisLabels(xTicks, xAxisOverride)
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

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.multibar.dispatch;

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
                })
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
            overrideAxisLabels(xTicks, xAxisOverride)
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

        chart.nvChart = nvChart;
        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.multibar.dispatch;

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

        chart.dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick'); // nvChart.pie.dispatch;

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