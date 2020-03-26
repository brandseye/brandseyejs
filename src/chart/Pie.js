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

    _getOverlayLabelColour(d){
        const segmentColour = d3.hcl(this.getD3Colour(d.data));
        let labelColour = d3.hcl(colours.eighteen.darkGrey);

        // invert
        if (segmentColour.l < 60) labelColour.l += Math.min(labelColour.l + 50, 100)

        return labelColour
    }

    _addOutsideLabels(pie, arcs, arc, outerArc){

        if (pie.select(".outer-labels").empty()){
            pie.append('g').attr('class','outer-labels')
        }

        const labels = pie.select('.outer-labels')
            .selectAll('text')
            .data(arcs, d => d.data._x);

        function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        const radius = Math.min(this.width(),this.height()) / 2;
        const textColour = d3.hcl(colours.eighteen.darkGrey).brighter();
        const lineColour = d3.hcl(textColour.h, textColour.c, textColour.l, 0.6);

        labels.enter()
            .append('text')
            .attr('pointer-events', 'none')
            .attr('fill', textColour)
            .each((d, i, nodes) => {
                const label = d3.select(nodes[i]);
                label.append('tspan')
                    .text(d => this.formatX()(d.data._x))
                    .attr('dy', '-0.25em')

                label.append('tspan')
                    .text(d => this.formatLabel()(d.data._y))
                    .attr('dy', '1em')
                    .attr("x", "0")
            })
            .merge(labels)
            .transition().duration(200)
            .attrTween("transform", function(d) {
                this._current = this._current || d;
                const interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    const d2 = interpolate(t);
                    const pos = outerArc.centroid(d2);
                    pos[0] = radius * 1.03 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate("+ pos +")";
                };
            })
            .styleTween("text-anchor", function(d){
                this._current = this._current || d;
                const interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    const d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start":"end";
                };
            });

        labels.exit().remove();

        if (pie.select(".outer-lines").empty()){
            pie.append('g').attr('class', 'outer-lines');
        }

        var polyline = pie.select(".outer-lines").selectAll("polyline")
            .data(arcs, d => d.data._x);

        polyline.enter()
            .append("polyline")
            .attr('stroke', lineColour)
            .attr('stroke-width', '1px')
            .attr('fill', 'none')
            .merge(polyline)
            .transition().duration(200)
            .attrTween("points", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    const leftAligned = midAngle(d2) < Math.PI;
                    var start = arc.centroid(d2);
                    var elbow = outerArc.centroid(d2);
                    var terminal = outerArc.centroid(d2);
                    terminal[0] = radius * 0.98 * (leftAligned ? 1 : -1);
                    const positions = [start, elbow];
                    if (leftAligned ? terminal[0] > elbow[0] : elbow[0] > terminal[0]){
                        positions.push(terminal);
                    }
                    return positions;
                };
            });

        polyline.exit().remove();
    }

    _addOverlaidLabels(pie, arcs, arc){
        pie.selectAll(".segment-labels").remove();
        const labels = pie.append('g')
            .attr('class','segment-labels')
            .selectAll('text')
            .data(arcs)

        labels.enter()
            .each((d, i, nodes) => {
                const centroid = arc.centroid(d);
                const labelColour = this._getOverlayLabelColour(d);

                let label = d3.select(nodes[i])
                    .append("text")
                    .attr("transform", "translate(" + centroid + ")")
                    .attr('text-anchor', 'middle')
                    .attr('pointer-events', 'none')
                    .style("opacity", 0)

                label
                    .append('tspan')
                    .text(this.formatX()(d.data._x))
                        .style("dy","-0.3em")
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
                    // label.attr("dx", (bounding.width / 2));
                    // label.attr("dy", -(bounding.height / 3));

                    label
                        .transition()
                        .duration(200)
                        .style("opacity", 1)
                // }
            })
    }

    _addCentreLabel(text){
        if (this._element.select('.y-axis-label').empty()){
            this._element.select('.pie')
                .append('g')
                .attr('class', 'y-axis-label')
        }
        this._element
            .select('.y-axis-label')
            .append('text')
            .attr('text-anchor', 'middle')
            .text(text)
    }

    prepareData(data, faceted){
        faceted = !!faceted && this.facet();
        data = data || this._data;
        if (!data || !data.length) return [];

        const x = this.x(),
              y = this.y(),
              scaleX = this.scaleX(),
              scaleY = this.scaleY();

        let mapped = [];

        data.forEach((d,index) => {
            if (faceted && !this.facet()(d)) return;
            const object = Object.assign({
                _key: index,
                _x: scaleX.transform(x(d)),
                _y: scaleY.transform(y(d)),
                _colour: scaleX.transform(x(d)),
                _size: this.size()(d)
            }, d);

            if (mapped[index]){
                mapped[index].data.push(object)
            } else {
                mapped.push({
                    _key: index,
                    _size: object._size,
                    _colour: object._colour,
                    data: [object]
                })
            }
        });

        return mapped
}

    getD3XScale(){
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

        const minDimension = Math.min(this.width(),this.height());

        const arc = d3.arc()
            .innerRadius(minDimension / 4)
            .outerRadius(minDimension / 2)

        const outerArc = d3.arc()
            .innerRadius(minDimension / 2 + 10)
            .outerRadius(minDimension / 2 + 10)

        const arcTween = function(a, i, nodes){
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return t => arc(i(t));
        }

        let pie = element.selectAll('.pie');

        if(pie.empty()){
            pie = element.append('g')
                .attr('class','pie')
                .attr("transform", `translate(${this.width()/2},${minDimension/2})`)
        }

        const arcs = d3.pie().value(this.y())(data);
        const segments = pie.selectAll('path').data(arcs, d => d.data._x);

        segments
            .enter()
            .append('path')
            .each(function(d){this._current = d})
            .merge(segments)
            .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                d3.select(nodes[i])
                  .interrupt("hover:colour")
                  .transition("hover:colour")
                  .duration(200)
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
                  .interrupt("hover:colour")
                  .transition("hover:colour")
                  .duration(200)
                  .style("fill", d => this.getD3Colour(d.data));
                this._dispatch.call("tooltipHide", this);
            })
            .style("fill", d => this.getD3Colour(d.data))
            .style("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker())
            .transition().duration(200)
            .attrTween('d', arcTween)

        segments.exit().remove()

        // TODO: do this in a more advanced / customisable way
        if (this.width() >= this.height() * 1.5){
            this._addOutsideLabels(pie, arcs, arc, outerArc);
        } else {
            this._addOverlaidLabels(pie, arcs, arc);
        }

        if (this.yAxisLabel()){
            this._addCentreLabel(this.yAxisLabel().short);
        }
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