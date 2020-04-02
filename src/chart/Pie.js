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
    constructor(name, isDonut, useOutsideLabels){
        super(name || 'PIE');
        this._is_donut = (typeof isDonut !== 'undefined' && isDonut !== null) ? isDonut : false;
        this._use_outside_labels = (typeof useOutsideLabels !== 'undefined' && useOutsideLabels !== null) ? useOutsideLabels : false;
        this._transition_duration = 200;
    }

    _getOverlayLabelColour(d){
        const segmentColour = d3.hcl(this.getD3Colour(d.data));
        let labelColour = d3.hcl(colours.eighteen.darkGrey);

        // invert
        if (segmentColour.l < 60) labelColour.l += Math.min(labelColour.l + 50, 100)

        return labelColour
    }

    _getWidthOfWidestLabel(){
        const allLabels = [
          ...this.xValues().map(xVal => this.formatX()(xVal)),
          ...this.yValues().map(yVal => this.formatLabel()(yVal))
        ];
        const text = this._element
            .append('text')
            .attr('class', 'label-width-check')

        text.selectAll('tspan')
            .data(allLabels)
            .enter()
            .append('tspan')
                .text(d => d)
                .style('opacity', 0.3)
                .attr('x', 0)
                .attr('dy', '1em')

        const textWidth = text.node().getBBox().width;

        text.remove();

        return textWidth
    }

    _getLabelHeight(){
      const text = this._element
        .append('text')
        .attr('class', 'label-height-check')

      const data = this.showLabels() ? ['Category', 'Value'] : ['Category'];

      text.selectAll('tspan')
        .data(data)
        .enter()
        .append('tspan')
        .text(d => d)
        .attr('x',0)
        .attr('dy','1em')

      const textHeight = text.node().getBBox().height;

      text.remove()

      return textHeight
    }

    _addCentreLabel() {
        let xText = this.xAxisLabel();
        let yText = this.yAxisLabel();

        const hasYText = yText || yText === 0;
        const hasXText = xText || xText === 0;

        if (hasXText) xText = xText && xText.short || xText;
        if (hasYText) yText = yText && yText.short || yText;

        let centreText = this._element.select('.centre-label');

        if (!hasXText && !hasYText){
            centreText.remove();
            return
        }

        if (centreText.empty()){
            centreText = this._element.select('.pie')
                .append('text')
                .attr('class', 'centre-label')
                .attr('text-anchor', 'middle')
        }

        let xSpan = centreText.select('.x');
        let ySpan = centreText.select('.y');

        // add spans
        if (hasYText && ySpan.empty()) ySpan = centreText.append('tspan').attr('class','y');
        if (hasYText && xSpan.empty()) xSpan = centreText.append('tspan').attr('class','x');

        // populate spans or remove unneeded
        hasYText
            ? ySpan
                .attr('dy', hasXText ? '-0.3em' : '0.3em')
                .text(yText)
            : ySpan
                .remove();

        hasXText
            ? xSpan
                .attr('dy', hasYText ? '1em' : '0.3em')
                .attr('x', '0')
                .text(xText)
            : xSpan
                .remove();
    }

    isDonut(bool) {
        if (arguments.length === 0) return this._is_donut;
        this._is_donut = bool;
        return this
    }

    useOutsideLabels(bool) {
        if (arguments.length === 0) return this._use_outside_labels;
        this._use_outside_labels = bool;
        return this
    }

    prepareData(data, faceted) {
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
            const xVal = scaleX.transform(x(d));
            const object = Object.assign({
                _key: index,
                _x: xVal,
                _y: scaleY.transform(y(d)),
                _colour: xVal,
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

    getD3XScale() {
        return d3.scaleOrdinal(this._data.map(d => this.x()(d)))
    }

    getD3YScale(data, height) {
        return d3.scaleLinear()
    }

    render() {
        // check how much width we need for labels
        const minLabelCharacters = 6;

        let availableWidth = this.width();
        let availableHeight = this.height();

        let widestLabelWidth = 0;
        let labelHeight = 0;

        if (this.useOutsideLabels()){
          widestLabelWidth = this._getWidthOfWidestLabel();
          labelHeight = this._getLabelHeight();
          availableWidth -= widestLabelWidth * 2;
          availableHeight -= labelHeight * 2;
        }

        const minDimension = Math.min(availableWidth, availableHeight);

        let pie = this._element.select('.pie');
        if(pie.empty()) {
            pie = this._element
                .append('g').attr('class','pie')
                .attr("transform", `translate(${availableWidth/2 + widestLabelWidth},${minDimension/2 + labelHeight})`)
        }

        const data = this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val));

        const arc = d3.arc()
            .innerRadius(this.isDonut() ? minDimension / 4 : 0)
            .outerRadius(minDimension / 2);

        const labelArc = this.isDonut()
            ? arc
            : d3.arc()
                .innerRadius(minDimension / 6)
                .outerRadius(minDimension / 2)

        const radius = arc.outerRadius()();

        const outerArc = d3.arc()
            .innerRadius(minDimension / 2 + 10)
            .outerRadius(minDimension / 2 + 10)

        const arcs = d3.pie().value(this.y())(data);

        let segmentWrapper = pie.select('.segments');
        if (segmentWrapper.empty()) segmentWrapper = pie.append('g').attr('class','segments');

        const segments = segmentWrapper.selectAll('.segment')
          .data(arcs, d => d.data._x);

        segments
            .enter()
            .append('g')
            .attr('class', 'segment')
            .each(function(d){this._current = d})
            .merge(segments)
            .each((d, i, nodes) => {
                const segment = d3.select(nodes[i]);
                const useOutsideLabels = this.useOutsideLabels();

                // path
                let path = segment.select('path');
                if (path.empty()) path = segment.append('path')
                path.style("fill", d => this.getD3Colour(d.data))
                    .style("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker())
                    .transition().duration(this._transition_duration)
                    .attrTween('d', function(p,pi,pnodes){
                        var i = d3.interpolate(this._current, p);
                        this._current = i(0);
                        return t => arc(i(t));
                    })

                // label
                let text = segment.select('text');
                if (text.empty()) text = segment.append('text')
                // text.attr('pointer-events', 'none') //

                let xLabel = text.select('.x-label');
                let yLabel = text.select('.y-label');
                if (xLabel.empty()) xLabel = text.append('tspan').attr('class','x-label');
                if (yLabel.empty()) yLabel = text.append('tspan').attr('class','y-label');

                xLabel
                    .style("dy", this.showLabels() ? "-0.3em" : "0.3em")
                    .text(d => this.formatX()(this.x()(d.data)));

                if (this.showLabels()){
                    yLabel
                        .attr("dy", "1em")
                        .attr("x", "0")
                        .text(d => this.formatLabel()(this.y()(d.data)));
                }

                function midAngle(d){
                    return d.startAngle + (d.endAngle - d.startAngle)/2;
                }

                const textColour = useOutsideLabels ? d3.hcl(colours.eighteen.darkGrey).brighter() : this._getOverlayLabelColour(d);

                text
                    .attr('fill', textColour)
                    .transition().duration(this._transition_duration)
                    .style('opacity', d => {
                        if (useOutsideLabels) return 1
                        const radians = d.endAngle - d.startAngle;
                        const arcLength = radians * radius;
                        const bounding = text.node().getBBox();
                        return bounding.width > arcLength ? 0 : 1
                    })
                    .attrTween("transform", function(d) {
                        this._current = this._current || d;
                        const interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);

                        return function(t) {
                            const dInt = interpolate(t);
                            if (useOutsideLabels){
                                const pos = outerArc.centroid(dInt);
                                pos[0] = radius * 1.03 * (midAngle(dInt) < Math.PI ? 1 : -1);
                                return "translate("+ pos +")";
                            } else {
                                return "translate(" + labelArc.centroid(dInt) + ")";
                            }
                        };
                    })
                    .styleTween("text-anchor", function(d){
                        this._current = this._current || d;
                        const interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function(t) {
                            const dInt = interpolate(t);
                            return useOutsideLabels ? ( midAngle(dInt) < Math.PI ? 'start' : 'end' ) : 'middle';
                        }
                    })
                /*
                let previousLabel = null;
                whether to display outer label
                const finalPos = outerArc.centroid(d);
                const rightHandSide = midAngle(d) < Math.PI;
                finalPos[0] = radius * 1.03 * (rightHandSide ? 1 : -1);
                const rect = this.getBoundingClientRect();

                let intersectsWithPreviousLabel = false

                if (rightHandSide && previousLabel && previousLabel.right){
                    intersectsWithPreviousLabel = (previousLabel.y + previousLabel.height) > finalPos[1]
                } else if (!rightHandSide && previousLabel && !previousLabel.right){
                    intersectsWithPreviousLabel = ( finalPos[1] + rect.height ) > previousLabel.y
                }

                previousLabel = { y: finalPos[1], height: rect.height, right: rightHandSide};

                return intersectsWithPreviousLabel ? 'none' : null
                */

                // lines

                let polyline = segment.select('polyline');
                if (useOutsideLabels && polyline.empty()){
                    polyline = segment.append('polyline');
                } else if (!useOutsideLabels) {
                    polyline.remove();
                }

                const lineColour = d3.hcl(textColour.h, textColour.c, textColour.l, 0.5);
                polyline
                    .attr('stroke', lineColour)
                    .attr('stroke-width', '1px')
                    .attr('fill', 'none')
                    .style('mix-blend-mode', 'multiply')
                    .transition().duration(this._transition_duration)
                    .attrTween("points", function(d){
                        this._current = this._current || d;
                        var interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function(t) {
                            var d2 = interpolate(t);
                            var start = arc.centroid(d2);
                            var elbow = outerArc.centroid(d2);
                            var terminal = outerArc.centroid(d2);
                            const leftAligned = midAngle(d2) < Math.PI;
                            terminal[0] = radius * 0.98 * (leftAligned ? 1 : -1);
                            const positions = [start, elbow];
                            if (leftAligned ? terminal[0] > elbow[0] : elbow[0] > terminal[0]){
                                positions.push(terminal);
                            }
                            return positions;
                        };
                    });
            })
            .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                d3.select(nodes[i]).select('path')
                  .interrupt("hover:colour")
                  .transition("hover:colour")
                  .duration(50)
                  .style("fill", d3.hcl(this.getD3Colour(d.data)).brighter(0.2))
                  .style("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker(0.4));
                this._dispatch.call("tooltipShow", this, {
                    e: d3.event,
                    point: d.data,
                    series: d.data._series,
                    seriesIndex: 0,//s_i
                    value: d.data._y
                })
            })
            .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
                d3.select(nodes[i]).select('path')
                  .interrupt("hover:colour")
                  .transition("hover:colour")
                  .duration(100)
                  .style("fill", d => this.getD3Colour(d.data))
                  .style("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker());
                this._dispatch.call("tooltipHide", this);
            })

        segments.exit().remove()

        this.isDonut()
            ? this._addCentreLabel()
            : this._element.select('.centre-label').remove();
    }

}

export function pie() {
    return new Pie();
}