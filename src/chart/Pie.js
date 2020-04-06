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

    _appendIfEmpty(appendTo, elementName, className) {
        let selection = appendTo.select('.' + className);
        if (selection.empty()) selection = appendTo.append(elementName).attr('class', className);
        return selection
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
            .style('font-size', this._font_size + 'px')
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
        .style('font-size', this._font_size + 'px')
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
            .style('font-size', this._font_size + 'px')
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
            const yVal = scaleY.transform(y(d));
            if (yVal !== 0){
                const object = Object.assign({
                    _key: index,
                    _x: xVal,
                    _y: yVal,
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
            }
        });

        return mapped
    }

    getD3XScale(data, width) {
        data = data || this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val), []);
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

    immediatelyRenderLabels(show){
        this.showLabels(!!show);
        this.render();
    }

    render() {
        let availableWidth = this.width();
        let availableHeight = this.height();

        let widestLabelWidth = 0;
        let labelHeight = 0;

        let maxLabelWidth = availableWidth / 4;
        const useOutsideLabels = this.useOutsideLabels();

        if (useOutsideLabels){
          widestLabelWidth = Math.min(this._getWidthOfWidestLabel(), maxLabelWidth);
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
            .merge(paths)
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
            .transition().duration(this._transition_duration)
            .attr("fill", d => this.getD3Colour(d.data))
            .attr("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker())
            .attrTween('d', function(p,pi,pnodes){
                var pInt = d3.interpolate(this._current, p);
                this._current = pInt(0);
                return t => arc(pInt(t));
            })


        paths.exit().remove();

        const segmentLabelsWrapper = this._appendIfEmpty(pie, 'g', 'segment-labels');

        const segmentLabels = segmentLabelsWrapper.selectAll('.segment-label')
            .data(arcs, d => d.data._x);

        const labelSizes = [];

        segmentLabels.enter()
            .append('g')
            .attr('class', 'segment-label')
            .merge(segmentLabels)
            .each((d, i, nodes) => {

                const labelWrapper = d3.select(nodes[i]);
                const text = this._appendIfEmpty(labelWrapper, 'text', 'label-wrapper');

                const textColour = useOutsideLabels
                    ? d3.hcl(colours.eighteen.darkGrey).brighter()
                    : this._getOverlayLabelColour(d);

                text.attr('pointer-events', 'none')
                    .attr('fill', textColour)
                    .style('font-size', this._font_size + 'px')

                const xLabel = this._appendIfEmpty(text, 'tspan', 'x-label');
                const yLabel = this._appendIfEmpty(text, 'tspan', 'y-label');

                let xLabelText = this.formatX()(this.x()(d.data));
                xLabel
                    .attr("dy", this.showLabels() ? "-0.3em" : "0.3em")
                    .text(xLabelText);

                if (!useOutsideLabels){
                    // TODO: calculate based on intersection of arc and text label
                    const radians = d.endAngle - d.startAngle;
                    const arcLength = radians * radius;
                    maxLabelWidth = arcLength;
                }

                let currWidth = xLabel.node().getBBox().width;

                // string-based
                // let truncSize = 2; // string-based
                // const half = Math.floor(xLabelText.length / 2);
                // const start = xLabelText.slice(0, half);
                // const end = xLabelText.slice(half);

                // word-based
                let truncSize = 1;
                let labelLength = xLabelText.length;

                const minChars = 5;
                const ellipsis = '...'; //\u2026

                while( currWidth > maxLabelWidth ){

                    // word-based
                    const xLabelWords = xLabelText.split(' ')
                    xLabelWords.splice(Math.ceil(xLabelWords.length / 2) - Math.floor(truncSize / 2), truncSize, ellipsis);
                    const truncatedText = xLabelWords.join(' ');
                    labelLength = truncatedText.length;

                    // string-based
                    // const truncatedText = start.slice(0, -truncSize) + ellipsis + end.slice(truncSize);

                    if (labelLength - ellipsis.length < minChars) {
                        break;
                    }

                    xLabel.text(truncatedText);
                    const newWidth = xLabel.node().getBBox().width;
                    if (newWidth >= currWidth){
                        break;
                    } else {
                        currWidth = newWidth;
                        ++truncSize;
                    }
                }

                if (this.showLabels()){
                    yLabel
                        .attr("dy", "1em")
                        .attr("x", "0")
                        .text(this.formatLabel()(this.y()(d.data)));
                } else {
                    yLabel.remove();
                }

                text
                    .transition().duration(this._transition_duration)
                    .attrTween("transform", function(arcData) {
                        this._current = this._current || arcData;
                        const interpolate = d3.interpolate(this._current, arcData);
                        this._current = interpolate(0);

                        return function(t) {
                            const dInt = interpolate(t);
                            if (useOutsideLabels){
                                const pos = outerArc.centroid(dInt);
                                pos[0] = radius * 1.09 * (midAngle(dInt) < Math.PI ? 1 : -1);
                                return "translate("+ pos +")";
                            } else {
                                return "translate(" + labelArc.centroid(dInt) + ")";
                            }
                        };
                    })
                    .styleTween("text-anchor", function(arcData){
                        this._current = this._current || arcData;
                        const interpolate = d3.interpolate(this._current, arcData);
                        this._current = interpolate(0);
                        return function(t) {
                            const dInt = interpolate(t);
                            return useOutsideLabels ? ( midAngle(dInt) < Math.PI ? 'start' : 'end' ) : 'middle';
                        }
                    })

                const finalPos = outerArc.centroid(d);
                const rightHandSide = midAngle(d) < Math.PI;
                const rect = text.node().getBoundingClientRect();

                labelSizes[d.index] = {y: finalPos[1], height: rect.height, rightHandSide};

                const line = this._appendIfEmpty(labelWrapper, 'polyline', 'label-line');

                if (useOutsideLabels) {
                    line
                        .attr('stroke', d3.hcl(colours.eighteen.darkGrey).brighter())
                        .attr('opacity', 0.5)
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
                                terminal[0] = radius * 1.05 * (leftAligned ? 1 : -1);
                                const positions = [start, elbow];
                                if (leftAligned ? terminal[0] > elbow[0] : elbow[0] > terminal[0]){
                                    positions.push(terminal);
                                }
                                return positions;
                            };
                        });
                } else {
                    line.remove()
                }
            })
            // hide intersecting or too-wide labels
            // giving preference to labels a lower arc index
            // only do this for outside labels for now
            .each((d, i, nodes) => {
                const labelWrapper = d3.select(nodes[i]);
                const label = labelWrapper.select('text');
                if (useOutsideLabels){
                    let hide = label.node().getBBox().width > maxLabelWidth;
                    if (!hide && d.index !== 0 && this.useOutsideLabels()){ // skip first label
                        const thisLabel = labelSizes[d.index];
                        const previousLabel = labelSizes[d.index - 1];

                        if (thisLabel.rightHandSide !== previousLabel.rightHandSide){
                            // different sides – ignore
                        } else if (thisLabel.rightHandSide) {
                            hide = (previousLabel.y + previousLabel.height) > thisLabel.y;
                        } else {
                            hide = ( thisLabel.y + thisLabel.height ) > previousLabel.y;
                        }
                    }
                    labelWrapper.style('visibility', hide ? 'hidden' : null);
                } else {
                    const radians = d.endAngle - d.startAngle;
                    const arcLength = radians * radius;
                    labelWrapper.style('visibility', label.node().getBBox().width > arcLength ? 'hidden' : null);
                }
            })

        segmentLabels.exit().remove();

        this.isDonut()
            ? this._addCentreLabel()
            : this._element.select('.centre-label').remove();
    }

}

export function pie() {
    return new Pie();
}