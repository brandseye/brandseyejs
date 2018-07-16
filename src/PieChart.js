import {colours} from './Colours';
import {Chart} from './Chart';

export class PieChart extends Chart {
    constructor() {
        super();
        this._colours = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];
    }

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

        //------------------------------------------------
        // Set up the SVG area

        let topLevel = d3.select(this._element).select("svg");
        if (topLevel.empty()) topLevel = d3.select(this._element).append("svg");

        topLevel
            .style("width", this._width + "px")
            .style("height", this._height + "px");

        // ---------------------------------
        // Layout the showLegend.
        //
        // We do this now because we need to know how much space the legend
        // takes up in order to finish calculating the margins.

        const legendHeight = this.renderLegend(topLevel, data, 0, this._width, this._height, d => d._key);

        //----------------------------------
        // Calculate margins.

        const margin = {top: 20, right: 20, bottom: 40, left: 40};
        margin.bottom += legendHeight ? legendHeight + 20 : 0;

        // if (this._dataAxisLabel) margin.left += 20 + 12;
        // if (data) {
        //     let maxLabelLength = 0;
        //     data.forEach(d => {
        //         d.data.forEach(d => {
        //             let length = this._xAxisTickFormat(this._x(d)).length;
        //             if (length > maxLabelLength) maxLabelLength = length;
        //         })
        //     });
        //     margin.bottom += maxLabelLength * 2 + 10;    // space for axes labels.
        // }

        const width = this._width - margin.left - margin.right,
              height = this._height - margin.top - margin.bottom;
        const radius = Math.min(width, height) / 2;

        //----------------------------------
        // Calculate scales and so on.

        let colour = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        //------------------------------

        let svg = topLevel.select('.main-group');

        if (svg.empty()) {
            svg = topLevel
                .append("g")
                .attr("class", "main-group");
        }

        svg.attr("transform", "translate(" + (margin.left + width / 2) + "," + (margin.top + height / 2) + ")");

        //---------------------------------
        // Get rid of current labels.
        svg.select(".chart-labels")
            .remove();

        //---------------------------------
        // append the arcs for the pie chart

        let pie = d3.pie()
            .sort(null)
            .value(d => d._y);

        let path = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        let label = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        let arcs = svg.select(".slices").selectAll('.arc');

        if (arcs.empty()) {
            arcs = svg
                .append("g")
                .attr("class", "slices")
                .selectAll(".arc");
        }

        let pieData = pie(data);
        arcs = arcs.data(pieData);
        arcs.exit().remove();

        function arcTween(d, i) {
            this._current = this._current || (i <= 0 ? { startAngle: 0, endAngle: 0} : pieData[i - 1]);
            let interpolator = d3.interpolate(this._current, d);
            this._current = interpolator(0);

            return function(t) {
                return path(interpolator(t))
            }
        }

        arcs.enter()
            .append("path")
                .attr("class", (d, i) => "arc " + "series series-" + i)
                .style("cursor", "pointer")
            .on("mouseover", (d, i, nodes) => { // Darken the pie on mouse over
                // We want to shift the pie out a bit on mouseover.
                // So we want to find the direction to move the pie in.
                // We can just ask the path helper to give us the centroid,
                // normalise it, and that is the direction to move in.
                const centre = path.centroid(d);
                const norm = Math.sqrt(centre[0] ** 2 + centre[1] ** 2);
                centre[0] = centre[0] / norm;
                centre[1] = centre[1] / norm;

                d3.select(nodes[i])
                    .interrupt("hover:colour")
                    .transition("hover:colour")
                    .duration(300)
                        .attr("transform", "translate(" + (centre[0] * 10) + "," + (centre[1] * 10) + "), scale(1.1)")
                        .style("fill", d3.hcl(this.getSeriesColour(i)).darker());
                this._dispatch.call("tooltipShow", this, {
                    e: d3.event,
                    point: d.data,
                    series: d.data._series,
                    seriesIndex: d.data._s_i,
                    value: d.data._y
                })
            })
            .on("mouseout", (d, i, nodes) => { // pie is regular colour on mouse out.
                d3.select(nodes[i])
                    .interrupt("hover:colour")
                    .transition("hover:colour")
                    .duration(300)
                        .attr("transform", "translate(0,0)")
                        .style("fill", this.getSeriesColour(i));
                this._dispatch.call("tooltipHide", this);
            })
            .on("click auxclick", (d, i, nodes) => {
                this._dispatch.call("elementClick", this, {
                    e: d3.event,
                    point: d.data,
                    series: d.data._series,
                    seriesIndex: d.data._s_i,
                    value: d.data._y
                })
            })
            .merge(arcs)
            .transition()
            .attrTween("d", arcTween)
                .attr("fill", (d, i) => this.getSeriesColour(i) );

        // arcs.append("text")
        //     .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
        //     .attr("dy", "0.35em")
        //     .text(d => {console.log("d is", d); return d.data._y; });


        // ---------------------------------
        // Labels loaded after our first bar grows.
        // if (this._show_labels) {
        //     svg.transition("bar:growth")
        //         .on("end", (d, i, nodes) => {
        //             if (i < nodes.length - 1) return;
        //             this.renderLabels(svg, data, x, xGroup, y);
        //         })
        // }

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

        labels.enter().each((series, s_i, s_nodes) => {
            let group = d3.select(s_nodes[s_i])
                .append("g")
                .attr("class", "label-group")
                .attr("transform", d => "translate(" + xscale(d.key) + ",0)")
                .selectAll(".chart-label")
                .data(series.data)
                .enter()
                .each((d, i, nodes) => {

                    // Want to figure out if the label is too dark / light for the
                    // bar.
                    let invertedColor = d3.hcl(this.getSeriesColour(i));
                    invertedColor.l += Math.min(invertedColor.l + 50, 100);
                    let invert = d3.hcl(this.getSeriesColour(i)).l < 60;

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
                        .style("font-family", "Open Sans, sans-serif")
                        .style("font-weight", "normal")
                        .style("font-size", fontSize + "px")
                        .style("fill", dy > 0 && invert ? invertedColor.toString() : colours.eighteen.darkGrey);

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
                        text
                            .attr("x", xgroup(d._key) + xgroup.bandwidth() / 2 - width / 2)
                            .attr("dy", calcDy(d._y));
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
            .style("font-family", "Open Sans, sans-serif")
            .style("font-size", "12px")
            .style("font-style", "italic")
            .style("fill", colours.eighteen.darkGrey);

        let width = label.node().getBBox().width;
        if (width >= height && this._dataAxisLabel.short) {
            label.text(this._dataAxisLabel.short);
            width = label.node().getBBox().width;
        }

        label.attr("dx", -width / 2);
    }

    //------------------------------------------------------


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
            .style("font-family", "Open Sans, sans-serif")
            .style("font-size", fontSize + "px")
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
            .style("font-family", "Open Sans, sans-serif")
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

        let series = data[0];
        series.values.forEach((d, d_i) => {

            results.push(Object.assign({
                _y: this._y(d),
                _series_key: series.key,
                _s_i: 0,
                _series: series,
                _key: this._xAxisOverride ? this._xAxisOverride[this._x(d)] : this._x(d)
            }, d));
        });

        return results;
    }

    getKeys() {
        let data = this._data;
        if (!data || !data.length) return [];

        return [...new Set(data.map(d => d.key))]
    }
}
