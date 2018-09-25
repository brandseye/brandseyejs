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
import { scaleIdentity } from "./Scales";
import { xaxis, yaxis } from "./Axes";
import {maxBounding} from "./helpers";


class FantasticChart {

    constructor() {
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
        this._x_formatter = d => "" + d;
        this._y_formatter = d => d;
        this._dispatch = d3.dispatch('elementClick', 'tooltipShow', 'tooltipHide');

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
        return this;
    }

    scaleY(scale) {
        if (arguments.length === 0) return this._scale_y;
        this._scale_y = scale;
        return this;
    }

    /*
     * Add geometry to render. Multiple geometries can be added.
     */
    geometry(geom) {
        if (arguments.length === 0) return this._geometries.slice(0);
        this._geometries.push(geom);
        return this;
    }

    size() {
        console.log("=> size: not implemented")
    }

    formatX(formatter) {
        if (arguments.length === 0) return this._x_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._x_formatter = formatter;
        return this;
    }

    formatY(formatter) {
        if (arguments.length === 0) return this._y_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._y_formatter = formatter;
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

    facetX(selector) {
        if (arguments.length === 0) return this._facet_x;
        if (selector != null && typeof selector !== 'function') throw new Error("The facet selector must be a function");
        this._facet_x = selector;
        return this;
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

    render() {
        console.log("-------- Rendering ---------");

        //-----------------------------------------------
        // Create initial svg element
        let svg = d3.select(this._element).select("svg");
        if (svg.empty()) svg = d3.select(this._element).append("svg");

        //-----------------------------------------------
        // Calculate the space that various elements will want to take up

        const geometries = this.sortGeometries();
        geometries.forEach(geom => this.setupGeom(geom));
        const axisWidth = geometries.length ? maxBounding(svg, geometries[0].yValues().map(geometries[0].formatY())).width + 10 : 0;

        //-----------------------------------------------
        // Calculate margins without knowing the final height.
        // We can only calculate the final height once we can accurately
        // determine how to lay out the x-axis.

        const margin = {top: 10, right: 10, bottom: 10, left: 10 + axisWidth};
        const width  = this._width - margin.left - margin.right;

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

        geometries.forEach(geom => geom.width(facetBand.bandwidth()));
        const axisSizeArea = svg.append("g")
            .attr("transform", "translate(-1000, -1000)");

        let axisHeight = 0;
        facets.forEach(facet => {
            const xScale = geometries[0]
                .width(facetBand.bandwidth())
                .facet(singleFacet ? null : (d => this._facet_x(d) === facet))
                .getD3XScale();

            let height = xaxis(axisSizeArea, this._height,
                xScale.bandwidth ? xScale.bandwidth() : facetBand.bandwidth() / xScale.domain().length,
                d3.axisBottom(xScale).tickSize(0).tickPadding(5).tickFormat(geometries[0].formatX()));

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

        xAxisArea.attr("transform", "translate(" + margin.left + ",0)");


        let yAxisArea = svg.select(".y-axis-area");

        yAxisArea.remove();
        yAxisArea = svg
            .append("g")
            .attr("class", "y-axis-area")
            .attr("transform", "translate(0," + margin.top + ")");


        if (geometries.length) {
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
                    d3.axisBottom(xScale).tickSize(0).tickPadding(5).tickFormat(geometries[0].formatX()))
            });

            const yscale = geometries[0]
                .height(height)
                .getD3YScale();

            yaxis(yAxisArea, d3.axisLeft(yscale).ticks(5).tickFormat(geometries[0].formatY())); //;.tickFormat(this._tickFormat));
        }


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
                console.log("------------ facet ", facet || "single-facet");
                const area = d3.select(facetNodes[facet_i]);
                let geoms = area.selectAll(".geometry").data(geometries);

                geoms.exit().remove();

                geoms.enter()
                          .each((geom, i, nodes) => {
                              const geom_width  = facetBand.bandwidth(),
                                    geom_height = height;

                              const geom_top  = 0,
                                    geom_left = 0;


                              let node = d3.select(nodes[i]);
                              node.append("g")
                                  .attr("class", "geometry")
                                  .attr("transform", "translate(" + geom_left + "," + geom_top + ")")
                                  .each((d, i, nodes) => {
                                      console.log("Setting height for", geom.name(), "to", height - axisHeight);
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
            .setupColourScale(this._colour_scale);
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




export function chart() {
    return new FantasticChart();
}