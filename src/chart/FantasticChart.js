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

import {colours} from '../Colours';
import {scaleIdentity} from "./Scales";
import {xaxis, xAxisLabel, yaxis, yAxisLabel, yGrid} from "./Axes";
import {maxBounding} from "../helpers";
import {buckets, removeLegend, renderLegend} from "../Legend";
import {restrictLength} from "../Strings";


class FantasticChart {

    constructor(name) {
        this._counter = this._counter || 0;
        this._counter++;
        this._name = name || ("Chart " + this._counter);
        this.reset();
    }

    reset() {
        this._geometries = [];
        this._x_getter = d => d.x;
        this._y_getter = d => d.y;
        this._data = [];
        this._element = null;
        this._width = 900;
        this._height = 512;
        this._colour = () => colours.eighteen.midGrey;
        this._size = () => 1;
        this._scale_x = scaleIdentity();
        this._scale_y = scaleIdentity();
        this._colour = () => 1;
        this._facet_x = null;
        this._colour_scale = d3.schemeAccent;
        this._d3_colour_scale = d3.schemeAccent;
        this._individual_colours = () => null;
        this._modify_colour = c => c;
        this._x_formatter = d => "" + d;
        this._y_formatter = d => d;
        this._x_importance = () => false;
        this._dispatch = d3.dispatch('elementClick', 'tooltipShow', 'tooltipHide');
        this._show_labels = true;
        this._show_legend = true;
        this._legend_colours = () => null;
        this._y_axis_label = null;
        this._x_axis_label = null;
        this._label_formatter = null;
        this._font_size = 12;
        this._x_grid_lines = false;
        this._y_grid_lines = false;
        this._axis_box = false;
        this._x_label_angle = null;
        this._grid_line_opacity = 0.15;
        this._x_tick_values_fn = null;
        this._y_tick_values_fn = null;
        return this;
    }

    /*
     * A DOM element that we want to render to.
     * See, for instance, document.getElementById(id), to get
     * such a dom element.
     */
    element(el) {
        if (arguments.length === 0) return this._element;
        this._element = el;
        return this;
    }

    width(width) {
        if (arguments.length === 0) return this._width;
        if (typeof width !== "number" && width > 0) throw new Error("width must be a positive number");
        this._width = width;
        return this;
    }

    height(height) {
        if (arguments.length === 0) return this._height;
        if (typeof height !== "number" && height > 0) throw new Error("height must be a positive number");
        this._height = height;
        return this;
    }

    x(getter) {
        if (arguments.length === 0) return this._x_getter;
        if (typeof getter !== 'function') throw new Error("x getter must be a function");
        this._x_getter = getter;
        return this;
    }

    y(getter) {
        if (arguments.length === 0) return this._y_getter;
        if (typeof getter !== 'function') throw new Error("y getter must be a function");
        this._y_getter = getter;
        return this;
    }

    scaleX(scale) {
        if (arguments.length === 0) return this._scale_x;
        this._scale_x = scale;
        if (scale) {
            scale.setCountGetter(d => d._y);
            scale.setCountSetter((d, v) => d._y = v);
        }
        return this;
    }

    scaleY(scale) {
        if (arguments.length === 0) return this._scale_y;
        this._scale_y = scale;
        if (scale) {
            scale.setCountGetter(d => d._x);
            scale.setCountSetter((d, v) => d._x = v);
        }

        return this;
    }

    /**
     * Add geometry to render. Multiple geometries can be added.
     */
    geometry(geom) {
        if (arguments.length === 0) return this._geometries.slice(0);
        geom.index(this._geometries.length);
        this._geometries.push(geom);
        return this;
    }

    size(getter) {
        if (arguments.length === 0) return this._size;
        if (typeof getter !== 'function') throw new Error("size getter must be a function");
        this._size = getter;
        return this;
    }

    formatX(formatter) {
        if (arguments.length === 0) return this._x_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._x_formatter = formatter;
        return this;
    }

    importanceX(importance) {
        if (arguments.length === 0) return this._x_importance;
        if (typeof importance !== 'function') throw new Error("importance must be a function");
        this._x_importance = importance;
        return this;
    }

    formatY(formatter) {
        if (arguments.length === 0) return this._y_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._y_formatter = formatter;
        return this;
    }

    formatLabel(formatter) {
        if (arguments.length === 0) return this._label_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._label_formatter = formatter;
        return this;
    }

    yAxisLabel(label) {
        if (arguments.length === 0) return this._y_axis_label;
        this._y_axis_label = label;
        return this;
    }

    xAxisLabel(label) {
        if (arguments.length === 0) return this._x_axis_label;
        this._x_axis_label = label;
        return this;
    }

    /**
     * Defines how to separate data visually using colours. It
     * does not define what colour to use.
     * @param colour
     * @returns {*}
     */
    colour(colour) {
        if (arguments.length === 0) return this._colour;
        if (typeof colour !== 'function') throw new Error("colour must be a function");
        this._colour = colour;
        return this;
    }

    /**
     * Defines colours to use.
     * @param colours
     */
    colourScale(colours) {
        if (arguments.length === 0) return this._colour_scale;
        if (typeof colours !== 'object' || !colours.length) throw new Error("colour must be an Array");
        this._colour_scale = colours;
        return this;
    }

    /**
     * Provide a function mapping x-value fields to a colour. The function is passed
     * the given data value, after it has been annotated with _x, _y, _colour, and so on.
     * This overrides
     * the colour scale. The colour scale will be used for values not defined by this map.
     * @param colourMap
     * @returns {*}
     */
    individualColours(colourMap) {
        if (arguments.length === 0) return this._individual_colours;
        if (typeof colourMap !== 'function') throw new Error("colourMap must be a function");
        this._individual_colours = colourMap;
        return this;
    }

    modifyColour(modifier) {
        if (arguments.length === 0) return this._modify_colour;
        if (typeof colourMap !== 'function') throw new Error("modifier must be a function");
        this._modify_colour = modifier;
        return this;
    }

    facetX(selector) {
        if (arguments.length === 0) return this._facet_x;
        if (selector != null && typeof selector !== 'function') throw new Error("The facet selector must be a function");
        this._facet_x = selector;
        return this;
    }

    /**
     * Whether to show labels or not. This is retained mode: it will not show the labels
     * immediately. Please call #render() again to show the labels.
     */
    showLabels(show) {
        if (arguments.length === 0) return this._show_labels;
        this._show_labels = !!show;
        return this;
    }

    /**
     * Indicates whether to show the legend or not. This is retained mode: you need to
     * call render after setting this to see a change.
     * @param show
     * @returns {*}
     */
    showLegend(show) {
        if (arguments.length === 0) return this._show_legend;
        this._show_legend = !!show;
        return this;
    }

    /**
     * Provide a function to override the mapping of legend names to colours.
     */
    legendColours(colourMap) {
        if (arguments.length === 0) return this._legend_colours;
        if (typeof colourMap !== 'function') throw new Error("colourMap must be a function");
        this._legend_colours = colourMap;
        return this;
    }

    fontSize(px) {
        if (arguments.length === 0) return this._font_size;
        if (typeof px !== "number" && px > 0) throw new Error("fontSize must be a positive number");
        this._font_size = px;
        return this;
    }

    xGridLines(show) {
        if (arguments.length === 0) return this._x_grid_lines;
        this._x_grid_lines = !!show;
        return this;
    }

    yGridLines(show) {
        if (arguments.length === 0) return this._y_grid_lines;
        this._y_grid_lines = !!show;
        return this;
    }

    axisBox(show) {
        if (arguments.length === 0) return this._axis_box;
        this._axis_box = !!show;
        return this;
    }

    xLabelAngle(degrees) {
        if (arguments.length === 0) return this._x_label_angle;
        if (degrees !== null && typeof degrees !== "number") throw new Error("degrees must be a number or null");
        this._x_label_angle = degrees;
        return this;
    }

    gridLineOpacity(opacity) {
        if (arguments.length === 0) return this._grid_line_opacity;
        if (typeof opacity !== "number") throw new Error("opacity must be a number or null");
        this._grid_line_opacity = opacity;
        return this;
    }

    /**
     * The function is passed the xScale and must return null or an array of values to use for ticks.
     */
    xTickValuesFn(fn) {
        if (arguments.length === 0) return this._x_tick_values_fn;
        if (fn && typeof fn !== "function") throw new Error("fn must be an function or null");
        this._x_tick_values_fn = fn;
        return this;
    }

    /**
     * The function is passed the yScale and must return null or an array of values to use for ticks.
     */
    yTickValuesFn(fn) {
        if (arguments.length === 0) return this._y_tick_values_fn;
        if (fn && typeof fn !== "function") throw new Error("fn must be an function or null");
        this._y_tick_values_fn = fn;
        return this;
    }

    /**
     * Renders or hides labels as they are requested.
     */
    immediatelyRenderLabels(show) {
        if (this._geometries) {
            this._geometries.forEach(geom => geom.immediatelyRenderLabels(!!show))
        }
    }

    /**
     * The event handle for the charts. Supports the following events:
     *
     * - elementClick
     * - tooltipShow
     * - tooltipHide
     *
     * @returns {*|Dispatch}
     */
    dispatch() {
        return this._dispatch;
    }

    data(data) {
        if (arguments.length === 0) return this._data.slice();
        this._data = data;
        return this;
    }

    /**
     * The chart's name, as defined in the constructor
     * @returns {String}
     */
    name() {
        return this._name;
    }

    render() {
        //-----------------------------------------------
        // Create initial svg element
        let svg = d3.select(this._element).select("svg");
        if (svg.empty()) svg = d3.select(this._element).append("svg");

        //-----------------------------------------------
        // Setup initial data

        const bs = buckets(this._data, this._colour, this._individual_colours, this._size);
        const colourScale = this._d3_colour_scale = d3.scaleOrdinal(this.colourScale())
                                                      .domain(Array.from(bs.colours));
        const axisOptions = {
            fontSize: this._font_size,
            xLabelAngle: this._x_label_angle,
            gridLineOpacity: this._grid_line_opacity,
            axisBox: this._axis_box
        }

        //-----------------------------------------------
        // Calculate the space that various elements will want to take up. We also
        // restrict the y axis by a proportion of the width of the metric.

        const yAxisRestriction = Math.max((this._width * 0.07), 25);

        const geometries = this.sortGeometries();
        geometries.forEach(geom => this.setupGeom(geom));
        const axisWidth = geometries.length
            ? maxBounding(svg, geometries[0].yValues()
                                            .map(geometries[0].formatY())
                                            .map(d => restrictLength(d, yAxisRestriction)), null, this._font_size).width + 15
            : 0;

        //-----------------------------------------------
        // Draw the legend
        if (!this._show_legend) removeLegend(svg);
        const legendHeight = this._show_legend
            ? renderLegend(svg, bs, (d) => this._legend_colours(d) || bs.bucketColour[d] || colourScale(d), this._width, this._height, null, axisOptions)
            : 0;

        //-----------------------------------------------
        // Calculate margins without knowing the final height.
        // We can only calculate the final height once we can accurately
        // determine how to lay out the x-axis.

        const outerPadding = 20;

        const margin = {
            top: outerPadding,
            right: outerPadding,
            bottom: outerPadding + legendHeight,
            left: outerPadding + axisWidth
        };
        if (this._y_axis_label) margin.left += 20;
        if (this._x_axis_label) margin.bottom += 40;
        const width  = this._width - margin.left - margin.right;
        const leftOuterPadding = outerPadding + (this._y_axis_label ? 20 : 0);

        //-----------------------------------------------
        // Determine initial facet / small multiple information

        const facets = getFacets(this._data, this._facet_x);
        const singleFacet = facets.length === 1;

        const facetBand = d3.scaleBand()
                            .rangeRound([0, width])
                            .padding(singleFacet ? 0 : 0.1) // take up full space if the only facet.
                            .domain(facets);

        //-----------------------------------------------
        // Determine x-axis height
        // We do this by rendering the various x-axes offscreen.

        const xTickCount = Math.floor(width / 90);

        geometries.forEach(geom => geom.width(facetBand.bandwidth()));
        const axisSizeArea = svg.append("g")
            .attr("transform", "translate(-1000, -1000)");

        const xAxisRestriction = Math.min(25, Math.max(this._height * 0.07, 12));
        let axisHeight = 0;
        facets.forEach(facet => {
            const xScale = geometries[0]
                .width(facetBand.bandwidth())
                .facet(singleFacet ? null : (d => this._facet_x(d) === facet))
                .getD3XScale();

            let axis = d3.axisBottom(xScale).ticks(xTickCount).tickSize(0).tickPadding(6)
                .tickFormat((d, i) => restrictLength(geometries[0].formatX()(d, i), xAxisRestriction))
                .tickValues(this._x_tick_values_fn ? this._x_tick_values_fn(xScale) : null)
            let height = xaxis(axisSizeArea, this._height,
                xScale.bandwidth ? xScale.bandwidth() : facetBand.bandwidth() / xScale.domain().length,
                axis, this.importanceX(), axisOptions);

            axisHeight = Math.max(height, axisHeight);
        });

        axisSizeArea.remove();

        //-----------------------------------------------
        // Update margins and calculate height

        margin.bottom += axisHeight;
        const height = this._height - margin.top - margin.bottom;

        //-----------------------------------------------
        // Setup the svg

        svg
            .style("width", this._width + "px")
            .style("height", this._height + "px");

        //-----------------------------------------------
        // An area for us to render the geometries in to.

        let drawingArea = svg.select('.drawing-area');

        if (drawingArea.empty()) {
            drawingArea = svg
                .append("g")
                .attr("class", "drawing-area")
        }

        drawingArea.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        //-----------------------------------------------
        // Set up small multiples / facets

        let facetAreas = drawingArea.selectAll('.facet').data(facets);
        facetAreas.exit().remove();

        //-----------------------------------------------
        // Setup axes.

        let xAxisArea = svg.select(".x-axis-area");

        xAxisArea.remove();
        xAxisArea = svg
            .append("g")
            .attr("class", "x-axis-area");

        xAxisArea.attr("transform", "translate(" + margin.left + "," + (margin.top + height) +")").lower();

        let yAxisArea = svg.select(".y-axis-area");
        const yTickCount = Math.floor(height / 90);

        yAxisArea.remove();
        yAxisArea = svg
            .append("g")
            .attr("class", "y-axis-area")
            .attr("transform", "translate(" + margin.left +"," + margin.top + ")").lower();

        const yScale = geometries.length ? geometries[0].height(height).getD3YScale() : null;
        if (geometries.length) {
            // Draw the yaxis.
            let tv = this._y_tick_values_fn ? this._y_tick_values_fn(yScale) : null
            let tc = Math.floor(height / 30)
            if (tc <= 2 && !tv) tv = yScale.domain()
            yaxis(yAxisArea,
                d3.axisLeft(yScale).ticks(tc)
                    .tickSize(this._y_grid_lines ? -width : 0)
                    .tickPadding(6)
                    .tickValues(tv)
                    .tickFormat((d, i) => restrictLength(geometries[0].formatY()(d, i), yAxisRestriction)), //;.tickFormat(this._tickFormat));
                axisOptions);

            // Draw a little x-axis for every facet.
            facets.forEach(facet => {
                const xScale = geometries[0]
                    .width(facetBand.bandwidth())
                    .height(height)
                    .facet(singleFacet ? null : (d => this._facet_x(d) === facet))
                    .getD3XScale();

                const area = xAxisArea
                    .append("g")
                    .attr("transform", "translate(" + (facetBand(facet)) + ",0)")// + (this._height - axisHeight) +")")
                    .attr("width", facetBand.bandwidth());


                xaxis(area, this._height,
                    xScale.bandwidth ? xScale.bandwidth() : facetBand.bandwidth() / xScale.domain().length,
                    d3.axisBottom(xScale).ticks(xTickCount).tickSize(this._x_grid_lines ? -height : 0).tickPadding(6)
                        .tickFormat((d, i) => restrictLength(geometries[0].formatX()(d, i), xAxisRestriction))
                        .tickValues(this._x_tick_values_fn ? this._x_tick_values_fn(xScale) : null),
                    this.importanceX(), axisOptions)
            });

        }

        //-----------------------------------------------
        // Setup labels

        yAxisLabel(svg, height, margin, this._y_axis_label, axisOptions);
        xAxisLabel(svg, width, height, margin, this._x_axis_label, axisOptions);

        //-----------------------------------------------
        // Draw individual geometries.

        facetAreas
            .enter()
            .append("g")
            .attr("class", "facet")
            .merge(facetAreas)
            .attr("width", facetBand.bandwidth())
            .attr("transform", facetId => {
                if (singleFacet) return "translate(0,0)";
                return "translate(" + facetBand(facetId) + ",0)";
            })
            .each((facet, facet_i, facetNodes) => {
                const area = d3.select(facetNodes[facet_i]);

                let geoms = area.selectAll(".geometry").data(geometries, d => d.key());

                const xscale = geometries[0].getD3XScale();
                const geom_width  = facetBand.bandwidth(),
                      geom_height = height;

                //yGrid(area, geom_width, this.scaleY().isShowGrid(), d3.axisLeft(yScale).ticks(yTickCount));
                //xGrid(area, geom_height, this.scaleX().isShowGrid(), d3.axisBottom(xscale).ticks(xTickCount));

                geoms.exit().remove();

                geoms.enter()
                     .append("g")
                     .attr("class", "geometry")
                     .merge(geoms)
                     .each((geom, i, nodes) => {
                         const geom_top  = 0,
                               geom_left = 0;

                         let node = d3.select(nodes[i]);

                         node
                             .attr("transform", "translate(" + geom_left + "," + geom_top + ")")
                             .each((d, i, nodes) => {
                                 geom.element(d3.select(nodes[i]))
                                     .facet(singleFacet ? null : (d => this._facet_x(d) === facet))
                                     .height(geom_height)
                                     .width(geom_width)
                                     .render();
                             })
                     });

                // Ensure this is rendered on top of other things.
                area.select(".x-axis").raise();
            })

    }


    /*
     * Ensures that each geom has the settings that it needs.
     */
    setupGeom(geom) {
        geom.setupX(this._x_getter)
            .setupY(this._y_getter)
            .setupColour(this._colour)
            .setupSize(this._size)
            .setupScaleX(this._scale_x)
            .setupScaleY(this._scale_y)
            .setupFormatX(this._x_formatter)
            .setupFormatY(this._y_formatter)
            .setupFormatLabel(this._label_formatter)
            .setupColourScale(this._colour_scale)
            .setupIndividualColours(this._individual_colours)
            .setupModifyColour(this._modify_colour)
            .setupShowLabels(this._show_labels)
            .d3ColourScale(this._d3_colour_scale)
            .fontSize(this._font_size);
        geom._dispatch.on("elementClick", (e) => {
            this._dispatch.call("elementClick", this, e);
        });
        geom._dispatch.on("tooltipHide", () => {
            this._dispatch.call("tooltipHide", this);
        });
        geom._dispatch.on("tooltipShow", (e) => {
            this._dispatch.call("tooltipShow", this, e);
        });
        geom.data(this._data);
    }


    /**
     * We want to ensure that geometries have a particular order to them.
     * This is important for rendering: lines should be rendered on top of
     * large histogram rectangles, for instance, otherwise they will be hidden.
     */
    sortGeometries() {
        if (!this._geometries || !this._geometries.length) return [];

        let geometries = this._geometries.slice(0);
        geometries.sort((lhs, rhs) => {
            return lhs.priority() - rhs.priority();
        });

        return geometries;
    }
}


/*
 * Returns the unique facet choices from the data, given a facet selector.
 */
function getFacets(data, selector) {
    if (!selector || !data || !data.length) return [1];

    const keys = new Set(data.map(selector));
    return [...keys];
}


/**
 * Create a new chart object.
 * @param name An optional name for the chart.
 * @returns {FantasticChart}
 */
export function chart(name) {
    return new FantasticChart(name);
}