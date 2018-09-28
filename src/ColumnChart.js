// Copyright (C) 2013-2014, 2018 BrandsEye (PTY) LTD
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
//     merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following
// conditions:
//
//     The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//     INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import {colours} from './Colours';
import {Chart} from './Chart';


export class ColumnChart extends Chart {

    //------------------------------------------------------

    data(data) {
        if (!arguments.length) return this._data;
        if (data && data[0].key === undefined) {
            data = [
                {
                    key: "series 1",
                    values: data
                }
            ];
        }
        this._data = data;
        return this;
    }

    //------------------------------------------------------

    element(element) {
        if (!arguments.length) return this._element;
        this._element = element;
        return this;
    }

    //------------------------------------------------------

    showLabels(show) {
        if (!arguments.length) return this._show_labels;
        this._show_labels = show;
        return this;
    }

    //------------------------------------------------------

    // todo dispatch
    showLegend(show) {
        if (!arguments.length) return this._show_legend;
        this._show_legend = show;
        return this;
    }

    //------------------------------------------------------

    x(x) {
        if (!arguments.length) return this._x;
        this._x = x;
        return this;
    }

    //------------------------------------------------------

    y(y) {
        if (!arguments.length) return this._y;
        this._y = y;
        return this;
    }

    //------------------------------------------------------

    width(width) {
        if (!arguments.length) return this._width;
        this._width = width;
        return this;
    }

    //------------------------------------------------------

    height(height) {
        if (!arguments.length) return this._height;
        this._height = height;
        return this;
    }

    //------------------------------------------------------

    colours(colours) {
        if (!arguments.length) return this._colours;
        this._colours = colours;
        return this;
    }

    //------------------------------------------------------

    backgroundColour(colour) {
        if (!arguments.length) return this._backgroundColour;
        this._backgroundColour = colour || "#FFF"; // never set it to null.
        return this;
    }

    //------------------------------------------------------

    tickFormat(format) {
        if (!arguments.length) return this._tickFormat;
        this._tickFormat = format;
        return this;
    }

    //------------------------------------------------------

    xAxisTickFormat(format) {
        if (!arguments.length) return this._xAxisTickFormat;
        this._xAxisTickFormat = format || (d => d.toString());
        return this;
    }

    //------------------------------------------------------

    labelFormat(format) {
        if (!arguments.length) return this._labelFormat;
        this._labelFormat = format || (d => d.toString());
        return this;
    }

    //------------------------------------------------------

    // todo missing
    labelCompression(compression) {
        if (!arguments.length) return this._compression;
        this._compression = compression;
        return this;
    }

    //------------------------------------------------------

    //todo missing
    dataAxisLabel(label) {
        if (!arguments.length) return this._dataAxisLabel;
        this._dataAxisLabel = label;
        return this;
    }

    //------------------------------------------------------

    tooltip(tooltip) {
        if (!arguments.length) return this._tooltip;
        this._tooltip = tooltip;
        return this;
    }

    //------------------------------------------------------

    forceY(force) {
        if (!arguments.length) return this._forceY;
        this._forceY = force;
        return this;
    }

    //------------------------------------------------------

// todo missing
    duration(duration) {
        if (!arguments.length) return this._duration;
        this._duration = duration;
        return this;
    }

// todo missing
    coarseness(coarseness) {
        if (!arguments.length) return this._coarseness;
        this._coarseness = coarseness;
        return this;
    }

    // todo missing
    padding(padding) {
        if (!arguments.length) return this._padding;
        this._padding = padding;
        return this;
    }

    // todo missing
    xAxisTooltips(tooltips) {
        if (!arguments.length) return this._xAxisTooltips;
        this._xAxisTooltips = tooltips;
        return this;
    }

    xAxisOverride(override) {
        if (!arguments.length) return this._xAxisOverride;
        this._xAxisOverride = override;
        return this;
    }

    interbarProportion(proportion) {
        if (!arguments.length) return this._interbarProportion;
        this._interbarProportion = proportion;
        return this;
    }

    //------------------------------------------------------

    dispatch() {
        return this._dispatch;
    }

    //------------------------------------------------------

    render() {
        if (!this._element) throw new Error("No element set for ColumnChart. See #element()");
        if (!this._data) {
            console.warn("No data set for ColumnChart. See #data()");
            return;
        }

        const data = this.getTransformedData();
        const keys = this.getKeys();

        //------------------------------------------------
        // Set up the SVG area

        let topLevel = d3.select(this._element).select("svg");
        if (topLevel.empty()) {
            topLevel = d3.select(this._element).append("svg");
        }

        topLevel
            .style("width", this._width + "px")
            .style("height", this._height + "px");


        // ---------------------------------
        // Layout the showLegend.
        //
        // We do this now because we need to know how much space the legend
        // takes up in order to finish calculating the margins.

        const legendHeight = this.renderLegend();

        //----------------------------------
        // Calculate margins.

        const margin = {top: 20, right: 20, bottom: 40, left: 40};
        margin.bottom += legendHeight ? legendHeight + 20 : 0;

        if (this._dataAxisLabel) margin.left += 20 + 12;
        if (data) {
            let maxLabelLength = 0;
            data.forEach(d => {
                d.data.forEach(d => {
                    let length = this._xAxisTickFormat(this._x(d)).length;
                    if (length > maxLabelLength) maxLabelLength = length;
                })
            });
            margin.bottom += maxLabelLength * 2 + 10;    // space for axes labels.
        }

        const width = this._width - margin.left - margin.right,
            height = this._height - margin.top - margin.bottom;

        //----------------------------------
        // Calculate scales and so on.

        const x = d3.scaleBand()
            .rangeRound([0, width])
            .padding(this._interbarProportion !== null ? this._interbarProportion : (this._data.length > 1 ? 0.08 : 0.1));

        const xGroup = d3.scaleBand()
            .padding(0);

        const y = d3.scaleLinear()
            .rangeRound([height, 0])
            .nice();
        this._xscale = x;
        this._xgroupscale = xGroup;
        this._yscale = y;

        // Scale the range of the data in the domains
        x.domain(data.map(d => d.key));
        xGroup.rangeRound([0, x.bandwidth()]).domain(keys);
        y.domain([0, d3.max(data, d => d3.max(d.data, d => d._y))]);

        //------------------------------

        let svg = topLevel.select('.main-group');

        if (svg.empty()) {
            svg = topLevel
                .append("g")
                .attr("class", "main-group");
        }

        svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //---------------------------------
        // Get rid of current labels.
        svg.select(".chart-labels")
            .remove();

        //---------------------------------
        // append the rectangles for the bar chart
        let groups = svg.select(".bars").selectAll('.group');

        if (groups.empty()) {
            groups = svg
                .append("g")
                .attr("class", "bars")
                .selectAll(".group");
        }

        svg.select(".bars")
            .attr("transform", "translate(0, " + height + "), scale(1, -1)")

        groups = groups.data(data);

        groups.exit().remove();

        // Adding new groups, and hence adding new bars to those groups.
        groups.enter()
            .append("g")
            .attr("class", "group")
            .attr("transform", d => "translate(" + x(d.key) + ",0)")
            .attr("width", x.bandwidth())
            .attr("height", "100%")
            .merge(groups)
            .interrupt("groups:move")
            .transition("groups:move")
            .attr("transform", d => "translate(" + x(d.key) + ",0)")
            .attr("width", x.bandwidth())
            .each((s_d, s_i, nodes) => {
                let group = d3.select(nodes[s_i])

                let bars = group.selectAll(".bar")
                    .data(s_d.data);

                bars.exit().remove();

                bars.interrupt("bar:move")     // Animate the bars to their new position.
                    .transition("bar:move")
                    .attr("width", xGroup.bandwidth())
                    .attr("x", d => xGroup(d._key))
                    .attr("y", 0);

                bars.enter()
                    .append("rect")
                    .attr("class", (d, i) => "bar series series-" + i)
                    .attr("x", d => xGroup(d._key))
                    .attr("y", 0)
                    .attr("width", xGroup.bandwidth())
                    .attr("height", 0)
                    .style("fill", (d, i) => this.getSeriesColour(i))
                    .style("cursor", "pointer")
                    .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                        d3.select(nodes[i])
                            .interrupt("hover:colour")
                            .transition("hover:colour")
                            .duration(400)
                            .style("fill", d3.hcl(this.getSeriesColour(i)).darker())
                        this._dispatch.call("tooltipShow", this, {
                            e: d3.event,
                            point: d,
                            series: s_d,
                            seriesIndex: s_i,
                            value: d._y
                        })
                    })
                    .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
                        d3.select(nodes[i])
                            .interrupt("hover:colour")
                            .transition("hover:colour")
                            .duration(400)
                            .style("fill", this.getSeriesColour(i));
                        this._dispatch.call("tooltipHide", this);
                    })
                    .on("click auxclick", (d, i, nodes) => {
                        this._dispatch.call("elementClick", this, {
                            e: d3.event,
                            point: d,
                            series: d._series,
                            seriesIndex: s_i,
                            value: this._y(d)
                        })
                    })
                    .merge(bars)
                    .interrupt("bar:growth")    // Animate bars growing.
                    .transition("bar:growth")
                    .delay((d) => {
                        return this.calcBarGrowth(s_i, nodes.length);
                    })
                    .duration(this._duration)
                    .style("fill", (d, i) => this.getSeriesColour(i))
                    .attr("height", d => height - y(d._y));

            })

        // ---------------------------------
        // Labels loaded after our first bar grows.
        if (this._show_labels) {
            svg.transition("bar:growth")
                .on("end", (d, i, nodes) => {
                    if (i < nodes.length - 1) return;
                    this.renderLabels(svg, data, x, xGroup, y);
                })
        }

        // ---------------------------------
        // Draw the y axis data label.

        if (this._dataAxisLabel) {
            this.renderDataAxisLabel(height, margin);
        }

        // ---------------------------------
        // Set the background colour

        d3.select(this._element).select(".background").remove();
        if (this._backgroundColour) {
            d3.select(this._element).select("svg")
                .append("rect")
                .attr("class", "background")
                .attr("width", "100%")
                .attr("height", "100%")
                .style("fill", this._backgroundColour)
                .lower();
        }

        //---------------------------------
        // add the Y gridlines
        svg.call(this.grid, width, d3.axisLeft(y).ticks(5));

        //---------------------------------
        // axes
        svg.call(this.xaxis, height, x.bandwidth(), d3.axisBottom(x).tickSize(0).tickPadding(5).tickFormat(this._xAxisTickFormat));
        svg.call(this.yaxis, d3.axisLeft(y).ticks(5).tickFormat(this._tickFormat));
    }

    //------------------------------------------------------

    /*
     * Returns an object with two functions, #show() and #hide(),
     * to show and hide the labels.
     */
    labels() {
        return {

            show: () => {
                if (this._element) {
                    let selection = this._element,
                        data = this.getTransformedData(),
                        xscale = this._xscale,
                        xgroup = this._xgroupscale,
                        yscale = this._yscale;

                    if (selection) selection = d3.select(this._element).select("svg").select("g");
                    if (!selection.empty() && data && xscale && yscale && xgroup) {
                        let labels = selection.select('.chart-labels');
                        if (!labels.empty()) return;
                        labels.remove()
                        this.renderLabels(selection, data, xscale, xgroup, yscale, false);
                    }
                }

            },

            hide: () => {
                if (this._element) {
                    d3.select(this._element)
                        .select('.chart-labels')
                        .interrupt("labels")
                        .interrupt("labels:fade")
                        .transition("labels:fade")
                        .style("opacity", 0)
                        .on("end", (d, i, nodes) => {
                            d3.select(nodes[i]).remove();
                        })
                }
            }
        }
    }

    //------------------------------------------------------

    renderLabels(selection, data, xscale, xgroup, yscale, animate) {
        animate = animate === undefined ? true : animate;
        selection.selectAll(".chart-labels").remove();

        let labels = selection.append("g")
            .attr("class", "chart-labels")
            // .selectAll(".chart-label")
            .selectAll(".label-group")
            .data(data)

        let maxWidth = 0;     // For calculating the max width of text.
        let fontSize = 12;    // Our initial font size.
        const buffer = 5;     // Buffer space between words and the top of a bar.
        const calcDy = (ypos) => ypos < 10 ? fontSize + buffer : -buffer;

        // Want to figure out if the label is too dark / light for the
        // bar.
        const getInvertedColor = (i) => {
            let invertedColor = d3.hcl(this.getSeriesColour(i));
            invertedColor.l += Math.min(invertedColor.l + 50, 100);
            return invertedColor;
        };
        const shouldInvert = (i) => d3.hcl(this.getSeriesColour(i)).l < 60;

        labels.enter().each((series, s_i, s_nodes) => {
            let group = d3.select(s_nodes[s_i])
                .append("g")
                .attr("class", "label-group")
                .attr("transform", d => "translate(" + xscale(d.key) + ",0)")
                .selectAll(".chart-label")
                .data(series.data)
                .enter()
                .each((d, i, nodes) => {
                    let ypos = yscale(d._y);
                    let dy = calcDy(ypos);
                    let text = d3.select(nodes[i])
                        .append("text")
                        .text(this._labelFormat(d._y))
                        .attr("class", "chart-label")
                        .attr("y", ypos)
                        .attr("dx", animate ? -15 : 0)
                        .attr("dy", dy)
                        .style("opacity", 0)
                        .style("pointer-events", "none")
                        // .style("font-family", "Open Sans, sans-serif")
                        // .style("font-weight", "normal")
                        // .style("font-size", fontSize + "px")
                        .style("fill", dy > 0 && shouldInvert(i)? getInvertedColor(i).toString() : colours.eighteen.darkGrey);

                    // Set the x position, which is based on width.
                    const width = text.node().getBBox().width;
                    maxWidth = Math.max(width, maxWidth);
                    text
                        .attr("x", xgroup(d._key) + xgroup.bandwidth() / 2 - width / 2);

                    text
                        .transition("labels")
                        .delay(() => animate ? this.calcBarGrowth(s_i, s_nodes.length) : 0) // Delay in lockstep with bar growth.
                        .duration(this._duration)
                        .attr("dx", 0)
                        .style("opacity", 1)
                })
        })


        // Figure out if we don't have enough space to show our labels.
        // We then want to resize, if possible.
        if (xgroup.bandwidth() < maxWidth * 1.05) {
            let scale = maxWidth / xgroup.bandwidth() * 1.05;
            fontSize = Math.floor(fontSize / scale);

            if (fontSize < 8) {
                // The labels are too small.
                labels.enter().selectAll("text").remove();
            } else {
                labels.enter()
                    .merge(labels)
                    .selectAll("text")
                    .style("font-size", fontSize + "px")
                    .each((d, i, nodes) => {
                        const text = d3.select(nodes[i]);
                        const width = text.node().getBBox().width;
                        const dy = calcDy(yscale(d._y));

                        text
                            .attr("x", xgroup(d._key) + xgroup.bandwidth() / 2 - width / 2)
                            .style("fill", dy > 0 && shouldInvert(i) ? getInvertedColor(i).toString() : colours.eighteen.darkGrey)
                            .attr("dy", dy);
                    })
            }
        }
    }

    //------------------------------------------------------

    renderDataAxisLabel(height, margins) {
        let svg = d3.select(this._element).select('svg');
        svg.selectAll(".data-labels").remove();

        if (!this._dataAxisLabel) return;
        let text = this._dataAxisLabel;
        if (text.long) text = text.long;

        let x = -(margins.top + height / 2);

        let label = svg.append("g")
            .attr("class", "data-labels")
            .append("text")
            .text(text)
            .attr("transform", "rotate(-90 0,0) translate(" + x + ", 20)")
            // .style("font-family", "Open Sans, sans-serif")
            // .style("font-size", "12px")
            // .style("font-style", "italic")
            .style("fill", colours.eighteen.darkGrey);

        let width = label.node().getBBox().width;
        if (width >= height && this._dataAxisLabel.short) {
            label.text(this._dataAxisLabel.short);
            width = label.node().getBBox().width;
        }

        label.attr("dx", -width / 2);
    }

    //------------------------------------------------------

    grid(selection, width, axis) {
        selection.select(".grid").remove();

        let grid = selection.append("g")
            .attr("class", "grid")
            .call(axis
                .tickSize(-width)
                .tickFormat("")
            );

        grid.selectAll("line")
            .style("stroke", colours.eighteen.lightGrey);
        grid.selectAll(".domain").remove();

        grid
            .lower() // Always ensure that this is earlier in the dom. Things must be drawn on top of it.
            .style("opacity", 0)
            .transition()
            .delay(500)
            .duration(500)
            .style("opacity", 1);
    }

    //------------------------------------------------------

    xaxis(selection, height, width, xaxis) {
        selection.select(".x-axis").remove();
        let axis = selection.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .style("opacity", 0)
            .call(xaxis);

        axis.select(".domain").remove();

        let max = 0;
        const fontSize = 12;
        axis.selectAll("text")
            // .style("font-family", "Open Sans, sans-serif")
            // .style("font-size", fontSize + "px")
            .style("fill", colours.eighteen.darkGrey)
            .nodes()
            .forEach(text => max = Math.max(max, text.getBBox().width));

        if (max >= width - 10) {
            const bad = max >= width * 2;
            const angle = bad ? -90 : -30;
            const fontSize = width <= 13 ? 8 : 12;
            const x = bad ? -fontSize : 0;
            const y = bad ? 5 : 2;

            axis.selectAll("text")
                .style('text-anchor', 'end')
                .style("font-size", fontSize + "px")
                .attr("transform", () => "translate(" + x + "," + y + ") rotate(" + angle + " 0,0)")
        }

        axis
            .transition()
            .duration(1000)
            .style("opacity", 1);
    }

    //------------------------------------------------------

    yaxis(selection, axis) {
        selection.select(".y-axis").remove();
        let x = selection.append("g")
            .attr("class", "y-axis")
            .call(axis.tickSize(0).tickPadding(10))
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        x.selectAll("text")
            // .style("font-family", "Open Sans, sans-serif")
            .style("fill", colours.eighteen.darkGrey)
    }

    //------------------------------------------------------

    calcBarGrowth(i, max) {
        if (max < 10) return i * this._BAR_GROWTH / 2;
        if (max < 35) return i * this._BAR_GROWTH / 4;
        return 1;
    }

    getSeriesColour(i) {
        if (i < 0 || !this._colours) return colours.eighteen.midGrey;

        i = i % this._colours.length;
        return this._colours[i];
    }

    getSortedData() {
        let data = this._data;
        if (!data || !data.length) return [];

        data = this._data.sort((lhs, rhs) => {
            lhs = lhs.key.toLowerCase();
            rhs = rhs.key.toLowerCase();

            if (lhs === rhs) return 0;
            if (lhs < rhs) return -1;
            return 1;
        });

        return data;
    }

    getTransformedData() {
        let data = this.getSortedData();
        if (!data || !data.length) return [];

        let results = [];

        const getX = d => this._xAxisOverride ? this._xAxisOverride[this._x(d)] : this._x(d);

        data.forEach((series, s_i) => {
            series.values.forEach((d, d_i) => {
                let field = results.find(bucket => bucket.key === getX(d));
                if (!field) {
                    field = {
                        data: [],
                        key: getX(d)
                    };
                    results.push(field);
                }

                field.data.push(Object.assign({
                    _series: series,
                    _s_i: s_i,
                    _key: series.key,
                    _y: this._y(d)
                }, d));
            })
        });

        return results;
    }

    getKeys() {
        let data = this._data;
        if (!data || !data.length) return [];

        return [...new Set(data.map(d => d.key))]
    }
}
