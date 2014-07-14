//--------------------------------------------------------------
// <a id="appendix"></a>
// ## Appendix: various helper objects


// ### Drawing labels

// This places labels on the data items of a chart, such as the bars on a bar chart.
// Currently this supports row and column charts, by
// setting the **position()** field to be 'rows' or 'columns'. You can also format
// how the label will appear by setting the format function.
namespace.chartLabel = function () {

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


    // The function that does the actual rendering of the labels. It takes
    // a D3 selection and returns itself.
    function draw(selection) {
        originalSelection = selection;

        selection.each(function (data) {
            if (data && data.length && !data[0].values) data = [
                {values: data}
            ];
            var length = data ? data.length : 1;

            var yDiff = -8;             // Space between label and bar.
            var slideDiff = -15;        // The space that new labels slide in over.
            var anchor = 'middle';      // Where text is anchored to relative to its length.
            var baseline = 'auto';      // Where text is anchored relative to its height.
            var getY = function (d) {
                return yScale(y(d)) + yDiff;
            };
            var getX = function (d, i, j) {
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
                    .data(function (d) {
                        return d.values;
                    });
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


    function setupCircleLabels(labels) {
        // Calculate beginning and end angles.
        var pie = d3.layout.pie()
            .sort(null)
            .value(function (d) {
                return y(d);
            })
        var radius = (Math.min(width, height) / 2) * 0.85;

        function calcAngle(d) {
            return (d.endAngle - d.startAngle) / 2.0 + d.startAngle;
        }

        labels.data(function (d) {
            return pie(d.values);
        });
        labels
            .each(function (d) {
                d.angle = calcAngle(d);
            })
            .style('text-anchor', function (d) {
                // Anchor depends on the side of the pie that the text appears on.
                if (d.angle < Math.PI / 8 || d.angle > 2 * Math.PI - Math.PI / 8) return 'middle';
                if ((d.angle > (Math.PI - Math.PI / 8)) && (d.angle < (Math.PI + Math.PI / 8))) return 'middle';
                return 0 < d.angle && d.angle < Math.PI ? "start" : "end";
            })
            .style('dominant-baseline', function (d) {
                // We want labels on the bottom half of the pie chart to hang,
                // and those on the top to use their lower baseline.
                if ((d.angle > (Math.PI / 8 + Math.PI / 2)) && (d.angle < (2 * Math.PI - Math.PI / 8 - Math.PI / 2))) return 'hanging';
                return Math.PI / 2 < d.angle && d.angle < 3 / 2 * Math.PI ? 'middle' : 'auto';
            })
            .text(function (d) {
                var angle = (d.endAngle - d.startAngle);
                return angle > 0.15 ? format(y(d.data)) : '';
            })
            .attr('transform', function (d) {
                var xPos = radius * Math.cos(d.angle - Math.PI / 2.0),
                    yPos = radius * Math.sin(d.angle - Math.PI / 2.0);
                return 'translate (' + (xPos + width / 2) + ', ' + (yPos + height / 2) + ')';
            });
    }


    // This is used to determine if we should scale text.
    // If we are drawing series data, the range should be contracted a bit.
    function calculateRangeBuffer(length) {
        return length > 1 ? 0.95 : 1.05;
    }

    function setupBarLabels(labels, length, getX, getY, anchor, yDiff) {
        var rangeBuffer = calculateRangeBuffer(length);

        var rangeBand = xScale.rangeBand() * rangeBuffer,
            availableSpace = rangeBand / length,
            compression = 0;
        if (determineCompression) {
            labels.each(function (d) {
                var tmp = determineCompression(y(d), availableSpace);
                if (compression == null || tmp > compression) compression = tmp;
            });
        }

        labels
            .text(function (d) {
                return format(y(d), compression);
            })
            .classed('small-label', false)  // Need to make sure this is removed, so that we get proper sizing.
            .style('text-anchor', function (d) {
                // We have enough space to flip the text into the bar.
                if (d.toString().length * 8 < getX(d)) return 'end';
                else return anchor;
            })
            .attr('x', function (d) {
                // Text has been flipped. Shift it slightly the other way.
                if (d.toString().length * 8 < getX(d)) return getX.apply(this, arguments) - 2 * yDiff;
                else return getX.apply(this, arguments);
            })
            .attr('y', getY);

        // Now that the labels have their text set, lets scale
        // them to fit the rangeBand.
        var removeLabels = _.once(function () {
            var remove = false;
            labels.each(function () {
                if (!remove) {
                    var bounds = this.getBBox();
                    var size = position == "columns" ? bounds.width : bounds.height;
                    remove = remove || size > availableSpace;
                }
            });
            if (remove) labels.remove();
        });

        if (scale) {
            _.delay(function () {
                // An initial pass to see if we should shrink text. The visibility
                // test is to ensure we don't have an NS_ERROR_FAILURE on requesting the bounding box.
                var shrink = false;
                labels.each(function () {
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

    draw.show = function () {
        d3.select(originalSelection.node())
            .selectAll('.chart-label')
            .transition()
            .duration(duration)
            .style('opacity', 1);

    };

    draw.hide = function (time) {
        if (_(time).isUndefined()) time = duration;
        d3.select(originalSelection.node())
            .selectAll('.chart-label')
            .transition()
            .duration(time)
            .style('opacity', zeroOpacity);
    };

    draw.isSpaceForLabels = function () {
        originalSelection.each(function (data) {
            if (!data) return true;

            var length = data.length,
                availableSpace = calculateRangeBuffer(length) / length,
                shrink = false;

            d3.select(this).selectAll('.chart-label').each(function () {
                if (!shrink) {
                    var bounds = this.getBBox();
                    shrink = shrink || bounds.width > availableSpace;
                }
            });
        });
    };

    draw.position = function (_) {
        if (!arguments.length) return position;
        position = _;
        return draw;
    };

    draw.x = function (_) {
        if (!arguments.length) return x;
        x = _;
        return draw;
    };

    draw.y = function (_) {
        if (!arguments.length) return y;
        y = _;
        return draw;
    };

    draw.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return draw;
    };

    draw.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return draw;
    };

    draw.delay = function (_) {
        if (!arguments.length) return delay;
        delay = _;
        return draw;
    };

    draw.xScale = function (_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return draw;
    };

    draw.yScale = function (_) {
        if (!arguments.length) return yScale;
        yScale = _;
        return draw;
    };

    draw.zeroOpacity = function (_) {
        if (!arguments.length) return zeroOpacity;
        zeroOpacity = _;
        return draw;
    };


    // Passes two possible arguments. The first is the data that should be formatted. The second
    // is an indiciation of the amount of compression that should occur, as determined by the
    // determineCompression function.
    draw.format = function (_) {
        if (!arguments.length) return format;
        format = _;
        return draw;
    };


    // This function should return a numeric indication of how much compression the label format
    // should incur. This number needs to be meaningful only to the label format function.
    // Larger numbers, however, should mean smaller compression.
    draw.determineCompression = function (_) {
        if (!arguments.length) return determineCompression;
        determineCompression = _;
        return draw;
    };

    /*
     * Whether we should scale labels to fit.
     */
    draw.scale = function (_) {
        if (!arguments.length) return scale;
        scale = _;
        return draw;
    };

    draw.showLabels = function (_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return draw;
    };

    return draw;
};


//----------------------------------------
// ### Drawing chart legends

// This determines the amount of space required for a legend, and also
// renders that legend.
namespace.chartLegend = function () {

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

        selection.each(function (d) {
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

                var entries = legend.selectAll('.legend-entry').data(function (d) {
                    return d;
                });
                entries.exit().remove();

                var newEntries = entries.enter();
                newEntries.append('g')
                    .classed('legend-entry', true)
                    .on('mouseover', function (d, i) {  // This highlights the item that we are mousing over.
                        // The selection object seems to have been damaged here. If we only use the original
                        // selection, then d3 begins to complain about undefined functions. So we reselect
                        // the element that it was pointing to.
                        var s = d3.select(selection.node());
                        s.selectAll('.nv-slice')
                            .classed('bar-fade', function (d) {
                                return d.data.legendKey != i;
                            });

                        s.selectAll('.nv-bar')
                            .classed('bar-fade', function (d) {
                                return d.legendKey != i;
                            })
                            .classed('bar-highlight', function (d) {
                                return d.legendKey == i;
                            });

                        s.selectAll('.chart-label')
                            .classed('bar-fade', function (d) {
                                if (d.data) return d.data.legendKey != i;
                                return d.legendKey != i;
                            });
                    })
                    .on('mouseout', function (d, i) {
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
                    .each(function () {
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

                entries.each(function (d, i) {
                    d3.select(this)
                        .select('rect')
                        .style('fill', function () {
                            if (colours) return d.color || colours[i % colours.length];
                            else return d.color || 'black';
                        });
                });

                // This index and odd data indexing is needed because d3 is only returning an index of 0, and has not
                // properly updated the data for these subelements.
                var index = 0;
                entries.selectAll('text')
                    .text(function () {
                        return xAxisTickFormat(30, brandseye.utilities.removeQuotes((data || d)[index++].key.toString()));
                    });

                index = 0;
                entries.selectAll('title')
                    .text(function () {
                        return brandseye.utilities.removeQuotes((data || d)[index++].key.toString());
                    });

                // Now we want to lay out the legend in columns. So we will
                // first determine the longest entry.
                var maxWidth = 0;
                entries.each(function () {
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
                    .attr('transform', function (d, i) {
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

    draw.margin = function (_) {
        if (!arguments.length) return margin;
        margin = _;
        return draw;
    };

    draw.colours = function (_) {
        if (!arguments.length) return colours;
        colours = _.concat(brandseye.colours.allColours);
        return draw;
    };

    draw.finalHeight = function (_) {
        return finalHeight;
    };

    draw.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return draw;
    };

    draw.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return draw;
    };

    draw.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return draw;
    };

    draw.showLegend = function (_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return draw;
    };

    draw.forceLegend = function (_) {
        if (!arguments.length) return forceLegend;
        forceLegend = _;
        return draw;
    };

    draw.zeroOpacity = function (_) {
        if (!arguments.length) return zeroOpacity;
        zeroOpacity = _;
        return draw;
    };

    return draw;
};
