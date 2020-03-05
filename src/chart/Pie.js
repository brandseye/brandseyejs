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

import { Geometry } from './Geometry';
import { toColourKey } from "../Legend";
import { equals } from "../helpers";
import {colours} from "../Colours";

class Pie extends Geometry {
    constructor(name){
        super(name || 'Pie');
    }

    _drawPie(dataWrapper, i, nodes){

        const data = dataWrapper.data;

        const minDimension = Math.min(this._width,this._height);

        const pie = d3.select(nodes[i])

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse())

        const arc = d3.arc()
            .innerRadius(minDimension / 4)
            .outerRadius(minDimension / 2)

        const arcs = d3.pie().value(d => d.count)(data)

        pie.selectAll('path')
            .data(arcs)
            .join('path')
                .attr('fill', d => color(d.data.label))
                .attr('d', arc)
    }

    render() {
        const element = this._element;
        const dataArray = this.prepareData(null, true);

        element.classed('pies', true);

        let groups = element.selectAll(".pie");

        const minDimension = Math.min(this._width,this._height);

        /*
            options
            -
            show legend || category label
                legend: measure block of space for legend
                category: measure space around for labels
            show value label
            pie || donut
            show pie || donut label (e.g. in the case of facets)
            labels on or around pie slices
            group tail end under others || all || # max slices

            to determine
            -
            how best to truncate labels?
                system-wide approach for brand names, topics, segments
                configurable shorthand/abbreviation || inferred abbreviation?
            where to show legend or if at all?
            sort by size?
            colour spectrum?
                dependent on user? E.g. Use topic colours vs basic hue shift for brands
        */

        groups
            .data(dataArray)
            .enter()
            .append("g")
                .attr("transform", `translate(${minDimension/2},${minDimension/2})`)
                .attr("width", minDimension)
                .attr("height", minDimension)
            .each(this._drawPie.bind(this))
    }

    getD3XScale(){
        return d3.scaleLinear()
    }

    getD3YScale(){
        return d3.scaleLinear()
    }
}

export function pie() {
    return new Pie();
}