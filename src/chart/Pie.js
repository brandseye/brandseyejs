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
            .attr('font-size', this._font_size + 'px')
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
        .attr('font-size', this._font_size + 'px')
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

        const centreText = this._appendIfEmpty(this._element.select('.pie'), 'text', 'centre-label')
            .attr('font-size', this._font_size + 'px')
            .attr('text-anchor', 'middle');

        if (!hasXText && !hasYText){
            centreText.remove();
            return
        }

        const ySpan = this._appendIfEmpty(centreText, 'tspan', 'y');
        const xSpan = this._appendIfEmpty(centreText, 'tspan', 'x');

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

    getD3XScale(data, width) {
        data = data || this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val));
        width = width || this.width();
        return d3.scaleBand()
                 .rangeRound([0, width])
                 .domain(data.map(d => d._x));
    }

    getD3YScale(data, height) {
        data = data || this.prepareData(null, false);
        height = height || this.height();

        const max = Math.max(d3.max(data, d => d3.max(d.data, d => d._y)), 0);
        const min = Math.min(0, d3.min(data, d => d3.min(d.data, d => d._y)));
        return d3.scaleLinear()
                 .rangeRound([height, 0])
                 .nice()
                 .domain([min, max]);
    }

    _appendIfEmpty(appendTo, elementName, className) {
        let selection = appendTo.select('.' + className);
        if (selection.empty()) selection = appendTo.append(elementName).attr('class', className);
        return selection
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

        const pie = this._appendIfEmpty(this._element, 'g', 'pie');
        pie.attr("transform", `translate(${availableWidth/2 + widestLabelWidth},${minDimension/2 + labelHeight})`)

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

        const midAngle = d => d.startAngle + (d.endAngle - d.startAngle)/2;

        const segmentWrapper = this._appendIfEmpty(pie, 'g', 'segments');

        const paths = segmentWrapper.selectAll('.segment')
          .data(arcs, d => d.data._x);

        paths.enter()
            .append('path')
            .attr('class','segment')
            .on("mouseover", (d, i, nodes) => {
                d3.select(nodes[i])
                .interrupt("hover:colour")
                .transition("hover:colour")
                .duration(50)
                .attr("fill", d3.hcl(this.getD3Colour(d.data)).brighter(0.2))
                .attr("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker(0.4));
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
                .duration(100)
                .attr("fill", d => this.getD3Colour(d.data))
                .attr("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker());
                this._dispatch.call("tooltipHide", this);
            })
            .on("click auxclick", (d, i, nodes) => {
                this._dispatch.call("elementClick", this, {
                    e: d3.event,
                    point: d.data,
                    series: d.data._series,
                    seriesIndex: 0, //d.data._s_i,
                    value: d.data._y
                })
            })
            .attr("fill", d => this.getD3Colour(d.data))
            .attr("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker())
            .each(function(d){this._current = d})
            .merge(paths)
            .transition().duration(this._transition_duration)
            .attrTween('d', function(p,pi,pnodes){
                var pInt = d3.interpolate(this._current, p);
                this._current = pInt(0);
                return t => arc(pInt(t));
            })

        paths.exit().remove();

        const segmentLabelsWrapper = this._appendIfEmpty(pie, 'g', 'segment-labels');

        const segmentLabels = segmentLabelsWrapper.selectAll('.segment-label')
            .data(arcs, d => d.data._x);

        segmentLabels.enter()
            .append('text')
            .attr('font-size', this._font_size + 'px')
            .attr('class', 'segment-label')
            .attr('pointer-events', 'none')
            .merge(segmentLabels)
            .each((d, i, nodes) => {
                const useOutsideLabels = this.useOutsideLabels();
                const text = d3.select(nodes[i]);
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

                const textColour = useOutsideLabels ? d3.hcl(colours.eighteen.darkGrey).brighter() : this._getOverlayLabelColour(d);

                text
                    .attr('fill', textColour)
                    .style('visibility', d => {
                        if (useOutsideLabels) return null
                        const radians = d.endAngle - d.startAngle;
                        const arcLength = radians * radius;
                        const bounding = text.node().getBBox();
                        return bounding.width > arcLength ? 'hidden' : null
                    })
                    .transition().duration(this._transition_duration)
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

                // let previousLabel = null;
                // whether to display outer label
                // const finalPos = outerArc.centroid(d);
                // const rightHandSide = midAngle(d) < Math.PI;
                // finalPos[0] = radius * 1.03 * (rightHandSide ? 1 : -1);
                // const rect = this.getBoundingClientRect();

                // let intersectsWithPreviousLabel = false

                // if (rightHandSide && previousLabel && previousLabel.right){
                //     intersectsWithPreviousLabel = (previousLabel.y + previousLabel.height) > finalPos[1]
                // } else if (!rightHandSide && previousLabel && !previousLabel.right){
                //     intersectsWithPreviousLabel = ( finalPos[1] + rect.height ) > previousLabel.y
                // }

                // previousLabel = { y: finalPos[1], height: rect.height, right: rightHandSide};

                // return intersectsWithPreviousLabel ? 'none' : null

            })

        segmentLabels.exit().remove();

        const labelLinesWrapper = this._appendIfEmpty(pie, 'g', 'label-lines');
        const labelLines = labelLinesWrapper.selectAll('.label-line')
            .data(arcs, d => d.data._x)

        if (this.useOutsideLabels()) {
            labelLines.enter()
                .append('polyline')
                .attr('class', 'label-line')
                .attr('stroke', d3.hcl(colours.eighteen.darkGrey).brighter())
                .attr('opacity', 0.5)
                .attr('stroke-width', '1px')
                .attr('fill', 'none')
                .style('mix-blend-mode', 'multiply')
                .merge(labelLines)
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

            labelLines.exit().remove();
        } else {
            labelLinesWrapper.remove();
        }

        this.isDonut()
            ? this._addCentreLabel()
            : this._element.select('.centre-label').remove();
    }

}

export function pie() {
    return new Pie();
}