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


import { colours } from './Colours';
import { maxBounding } from "./helpers";
import { Chart } from "./Chart";


export class BarChart extends Chart {

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
        if (topLevel.empty()) topLevel = d3.select(this._element).append("svg")

        topLevel
            .style("width", this._width + "px")
            .style("height", this._height + "px");


        // ---------------------------------
        // Measure max data axis text length

        const dataAxisBB = maxBounding(topLevel, data.map(d => this._xAxisTickFormat(d.key)));

        // ---------------------------------
        // Layout the showLegend.
        //
        // We do this now because we need to know how much space the legend
        // takes up in order to finish calculating the margins.

        const legendHeight = this.renderLegend();

        //----------------------------------
        // Calculate margins.

        const margin = {top: 20, right: 20, bottom: 40, left: 10};
        margin.bottom += legendHeight ? legendHeight + 20 : 0;
        margin.left += dataAxisBB.width + 10;
        if (this._dataAxisLabel) margin.bottom += 10 + 12;

        const width = this._width - margin.left - margin.right,
              height = this._height - margin.top - margin.bottom;

        //----------------------------------
        // Calculate scales and so on.

        const x = d3.scaleLinear()
            .rangeRound([0, width])
            .nice();

        const y = d3.scaleBand()
            .rangeRound([0, height])
            .padding(this._data.length > 1 ? 0.08 : 0.02);

        const yGroup = d3.scaleBand()
            .padding(0);

        this._xscale = x;
        this._ygroupscale = yGroup;
        this._yscale = y;

        // Scale the range of the data in the domains
        y.domain(data.map(d => d.key));
        yGroup.rangeRound([0, y.bandwidth()]).domain(keys);
        x.domain([0, d3.max(data, d => d3.max(d.data, d => d._y))]);

        //------------------------------

        let svg = topLevel.select('.main-group');

        if (svg.empty()) {
            svg = topLevel
                .append("g")
                .attr("class", "main-group")
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

        groups = groups.data(data);

        groups.exit().remove();

        // Adding new groups, and hence adding new bars to those groups.
        groups.enter()
            .append("g")
                .attr("class", "group")
                .attr("transform", d => "translate(0," + y(d.key) + ")")
                .attr("height", height - y.bandwidth())
                .attr("width", "100%")
            .merge(groups)
            .interrupt("groups:move")
            .transition("groups:move")
                .attr("transform", d => "translate(0," + y(d.key) + ")")
                .attr("height", y.bandwidth())
            .each((s_d, s_i, nodes) => {
                let group = d3.select(nodes[s_i]);

                let bars = group.selectAll(".bar")
                    .data(s_d.data);

                bars.exit().remove();

                bars.interrupt("bar:move")     // Animate the bars to their new position.
                    .transition("bar:move")
                        .attr("height", yGroup.bandwidth())
                        .attr("y", d => yGroup(d._key))
                        .attr("x", 0);

                bars.enter()
                    .append("rect")
                        .attr("class", (d, i) => "bar series series-" + i)
                        .attr("y", d => yGroup(d._key))
                        .attr("x", 0)
                        .attr("height", yGroup.bandwidth())
                        .attr("width", 0)
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
                    .delay(() => {
                        return this.calcBarGrowth(s_i, nodes.length);
                    })
                    .duration(this._duration)
                        .style("fill", (d, i) => this.getSeriesColour(i))
                        .attr("width", d => x(d._y));

            });

        // ---------------------------------
        // Labels loaded after our first bar grows.
        if (this._show_labels) {
            svg.transition("bar:growth")
                .on("end", (d, i, nodes) => {
                    if (i < nodes.length - 1) return;
                    this.renderLabels(svg, data, x, yGroup, y);
                })
        }

        // ---------------------------------
        // Draw the data axis data label.

        if (this._dataAxisLabel) {
            this.renderDataAxisLabel(width, margin);
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
        svg.call(this.grid, height, d3.axisBottom(x).ticks(5));

        //---------------------------------
        // axes
        svg.call(this.labelAxis, d3.axisLeft(y).tickSize(0).tickPadding(5).tickFormat(this._xAxisTickFormat));
        svg.call(this.dataAxis, height, d3.axisBottom(x).ticks(5).tickFormat(this._tickFormat));
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
                        ygroup = this._ygroupscale,
                        yscale = this._yscale;

                    if (selection) selection = d3.select(this._element).select("svg").select("g");
                    if (!selection.empty() && data && xscale && yscale && ygroup) {
                        let labels = selection.select('.chart-labels');
                        if (!labels.empty()) return;
                        labels.remove()
                        this.renderLabels(selection, data, xscale, ygroup, yscale, false);
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

    renderLabels(selection, data, xscale, ygroup, yscale, animate) {
        animate = animate === undefined ? true : animate;
        selection.selectAll(".chart-labels").remove();

        let labels = selection.append("g")
            .attr("class", "chart-labels")
            .selectAll(".label-group")
            .data(data);

        let fontSize = 12;    // Our initial font size.
        const buffer = 5;     // Buffer space between words and the top of a bar.

        labels.enter().each((series, s_i, s_nodes) => {
            let group = d3.select(s_nodes[s_i])
                .append("g")
                .attr("class", "label-group")
                .attr("transform", d => "translate(0," + yscale(d.key) + ")")
                .selectAll(".chart-label")
                .data(series.data)
                .enter()
                .each((d, i, nodes) => {

                    // Want to figure out if the label is too dark / light for the
                    // bar.
                    let invertedColor = d3.hcl(this.getSeriesColour(i));
                    invertedColor.l += Math.min(invertedColor.l + 50, 100);
                    let invert = d3.hcl(this.getSeriesColour(i)).l < 60;

                    let xpos = xscale(d._y);

                    let text = d3.select(nodes[i])
                        .append("text")
                        .text(this._labelFormat(d._y))
                            .attr("class", "chart-label")
                            .attr("x", xpos + buffer)
                            .attr("dx", animate ? -15 : 0)
                            .style("opacity", 0)
                            .style("pointer-events", "none")
                            .style("font-size", fontSize + "px");


                    const bb = text.node().getBBox();
                    const oversize = xpos + bb.width + buffer > xscale.range()[1];

                    text
                        .attr("y", ygroup(d._key) + fontSize / 2 + ygroup.bandwidth() / 2)
                        .attr("x", oversize ? xpos - buffer - bb.width : xpos + buffer)
                        .style("fill", oversize && invert ? invertedColor.toString() : colours.eighteen.darkGrey);

                    text
                        .transition("labels")
                        .delay(() => animate ? this.calcBarGrowth(s_i, s_nodes.length) : 0) // Delay in lockstep with bar growth.
                        .duration(this._duration)
                        .attr("dx", 0)
                        .style("opacity", 1)
                })
        });

    }

    //------------------------------------------------------

    renderDataAxisLabel(width, margins) {
        let svg = d3.select(this._element).select('svg');
        svg.selectAll(".data-labels").remove();

        if (!this._dataAxisLabel) return;
        let text = this._dataAxisLabel;
        if (text.long) text = text.long;

        let x = (margins.left + width / 2);

        let label = svg.append("g")
            .attr("class", "data-labels")
            .append("text")
            .text(text)
            .attr("transform", "translate(" + x + "," + (this._height - margins.bottom + 50) + ")")
            .style("fill", colours.eighteen.darkGrey);

        let textWidth = label.node().getBBox().width;
        if (textWidth >= width && this._dataAxisLabel.short) {
            label.text(this._dataAxisLabel.short);
            textWidth = label.node().getBBox().width;
        }

        label.attr("dx", -textWidth / 2);
    }

    //------------------------------------------------------



    grid(selection, height, axis) {
        selection.select(".grid").remove();

        let grid = selection.append("g")
            .attr("class", "grid")
            .call(axis
                .tickSize(height)
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

    labelAxis(selection, axis_object) {
        selection.select(".label-axis").remove();
        let axis = selection.append("g")
            .attr("class", "label-axis")
            .style("opacity", 0)
            .call(axis_object);

        axis.select(".domain").remove();

        let max = 0;
        const fontSize = 12;
        axis.selectAll("text")
            .style("fill", colours.eighteen.darkGrey)
            .nodes()
            .forEach(text => max = Math.max(max, text.getBBox().width));

        axis
            .transition()
            .duration(1000)
            .style("opacity", 1);
    }

    //------------------------------------------------------

    dataAxis(selection, height, axis_object) {
        selection.select(".data-axis").remove();
        let axis = selection.append("g")
                .attr("class", "data-axis")
                .attr("transform", "translate(0," + height + ")")
            .call(axis_object.tickSize(0).tickPadding(10))
                .style("opacity", 0)
            .transition()
            .duration(1000)
                .style("opacity", 1);

        axis.selectAll("text")
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
