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


class FantasticChart {

    constructor() {
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

    colour(colour) {
        if (arguments.length === 0) return this._colour;
        if (typeof colour !== 'function') throw new Error("colour must be a function");
        this._colour = colour;
        return this;
    }

    facetX(selector) {
        if (arguments.length === 0) return this._facet_x;
        if (typeof selector !== 'function') throw new Error("The facet selector must be a function");
        this._facet_x = selector;
        return this;
    }

    data(data) {
        if (arguments.length === 0) return this._data.slice();
        this._data = data;
        return this;
    }

    render() {
        console.log("-------- Rendering ---------");

        //-----------------------------------------------

        const margin = {top: 10, right: 10, bottom: 10, left: 10};

        const width  = this._width - margin.left - margin.right,
              height = this._height - margin.top - margin.bottom;

        //-----------------------------------------------
        // Setup the svg
        let svg = d3.select(this._element).select("svg");
        if (svg.empty()) svg = d3.select(this._element).append("svg");

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

        const facets = getFacets(this._data, this._facet_x);
        const singleFacet = facets.length === 1;
        let facetAreas = drawingArea.selectAll('.facet').data(facets);

        facetAreas.exit().remove();

        const facetBand = d3.scaleBand()
                            .rangeRound([0, width])
                            .padding(singleFacet ? 0 : 0.1) // take up full space if the only facet.
                            .domain(facets);

        //-----------------------------------------------
        // Draw individual geometries.

        facetAreas
            .enter()
            .append("g")
            .attr("class", "facet")
            .merge(facetAreas)
            .attr("width", facetBand.bandwidth())
            .attr("transform", facetId => {
                if (singleFacet) return "translate(0, 0)";
                return "translate(" + facetBand(facetId) + ",0)";
            })
            .each((facet, facet_i, facetNodes) => {
                console.log("------------ facet ", facet || "single-facet");
                const area = d3.select(facetNodes[facet_i]);
                let geometries = area.selectAll(".geometry").data(this._geometries);

                geometries.exit().remove();

                geometries.enter()
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
                                      this.setupGeom(geom);
                                      geom.element(d3.select(nodes[i]))
                                          .facet(singleFacet ? null : (d => this._facet_x(d) === facet))
                                          .width(geom_width)
                                          .height(geom_height)
                                          .render();
                                  })
                          })
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
            .setupScaleY(this._scale_y);
        geom.data(this._data);
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