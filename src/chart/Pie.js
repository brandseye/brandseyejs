// Copyright (C) 2020 BrandsEye (PTY) LTD
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
import { colours } from "../Colours";

class Pie extends Geometry {
    constructor(name){
        super(name || 'PIE');
    }

    _getLabelColour(d){
        const fillColour = d3.hcl(this.getD3Colour(d.data));
        const shouldInvert = fillColour.l < 60;
        let labelColour = d3.hcl(colours.eighteen.darkGrey);
        if (shouldInvert) labelColour.l += Math.min(labelColour.l + 50, 100)
        return labelColour
    }

    _addLabel(d, textNode, arc){
        const centroid = arc.centroid(d);
        const labelColour = this._getLabelColour(d);

        let label = textNode
            .attr("transform", "translate(" + centroid + ")")
            .style("opacity", 0)

        label
            .append('tspan')
            .text(this.formatX()(d.data._x))
                .style("dy","-1em")
                .style("fill",labelColour);

        label
            .append('tspan')
            .attr("dy", "1em")
            .attr("x", "0")
            .text(this.formatLabel()(d.data._y))
                .style("fill", labelColour);

        // const radians = d.endAngle - d.startAngle;
        // const radius = arc.innerRadius()();
        // const arcLength = radians * radius;
        const bounding = label.node().getBBox();

        // if (bounding.width < arcLength) {
            label.attr("dx", -(bounding.width / 2));
            label.attr("dy", (bounding.height / 2));

            label
                .transition()
                .duration(1000)
                .style("opacity", 1)
        // }
    }

    prepareData(data, faceted){
        data = Geometry.prototype.prepareData.call(this, data, faceted);
        data[0].data.map(d => d._colour = this.x()(d));
        return data
    }

    getD3XScale(){
        // return d3.scaleOrdinal(this._data.map(d => d._x))
        // console.log(this._data.map(d => this.x()(d)))
        return d3.scaleOrdinal(this._data.map(d => this.x()(d)))
    }

    getD3YScale(data, height) {
        data = data || this.prepareData(null, true);
        height = height || this.height();

        return d3.scaleBand()
                 .rangeRound([0, height])
    }

    render() {
        const element = this._element;
        const data = this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val));

        // console.log(data);
        const minDimension = Math.min(this.width(),this.height());

        const arc = d3.arc()
            .innerRadius(minDimension / 4)
            .outerRadius(minDimension / 2)

        // https://bl.ocks.org/mbostock/5681842
        const arcTween = function(a, i, nodes){
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return t => arc(i(t));
        }

        let pie = element.selectAll('.pie');

        if(pie.empty()){
            pie = element.append('g')
                .attr('class','pie')
                .attr("transform", `translate(${minDimension/2},${minDimension/2})`)
                .attr("width", minDimension)
                .attr("height", minDimension);
        }

        const arcs = d3.pie().value(this.y())(data);
        const segments = pie.selectAll('g.segment-wrapper').data(arcs, d => d.data._key);

        const segmentWrappers = segments
            .enter()
            .append('g')
            .attr('class', 'segment-wrapper')
            .merge(segments)

        segmentWrappers
            .append('path')
            .each(function(d){this._current = d})
            .style("fill", d => this.getD3Colour(d.data))
            .transition()
            .duration(200)
            .attrTween('d', arcTween)

        segmentWrappers
            .append('text')
            .each((d, i, nodes) => {
                this._addLabel(d, d3.select(nodes[i]), arc);
            })

        segmentWrappers
            .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                d3.select(nodes[i])
                    .selectAll('path')
                    .interrupt("hover:colour")
                    .transition("hover:colour")
                    .duration(100)
                    .style("fill", d3.hcl(this.getD3Colour(d.data)).darker());
                this._dispatch.call("tooltipShow", this, {
                    e: d3.event,
                    point: d.data,
                    series: d.data._series,
                    seriesIndex: 0,//s_i
                    value: d.data._y
                })
            })
            .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
                d3.select(nodes[i])
                    .selectAll('path')
                    .interrupt("hover:colour")
                    .transition("hover:colour")
                    .duration(100)
                    .style("fill", d => this.getD3Colour(d.data));
                this._dispatch.call("tooltipHide", this);
            })

        segments.exit().remove()

        // this._addLabels(pie, arcs, arc);

    }

}

export function pie() {
    return new Pie();
}

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