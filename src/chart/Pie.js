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
            .style('visibility', 'hidden')

        text.selectAll('tspan')
            .data(allLabels)
            .enter()
            .append('tspan')
            .attr('x','0')
            .text(d => d)

        const textWidth = text.node().getBBox().width;

        text.remove();

        return textWidth
    }

    _getLabelHeight(){
      const text = this._element
        .append('text')
        .style('font-size', this._font_size + 'px')
        .attr('class', 'label-height-check')
        .style('visibility', 'hidden')

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

    _getSegmentLabelBoundingPoints(label, atPoint) {
        /*
        assumes:
        • label is centred around a given point. e.g.:
         - text-anchor: middle
         - left === atPoint[0] + width/2
         - top === atPoint[1] + height/2
        • label.node() is not a tspan
        */

        const bounds = label.node().getBBox();
        const w = bounds.width; //label.node().getComputedTextLength();
        const h = bounds.height;
        const x = atPoint[0];
        const y = atPoint[1];

        return [
            {x: x-w/2, y: y-h/2},
            {x: x+w/2, y: y-h/2},
            {x: x-w/2, y: y+h/2},
            {x: x+w/2, y: y+h/2}
        ];
    }

    /**
     * @param {{x: number, y: number}[]} points Array of points
     * @param {number} startAngle Number in radians
     * @param {number} endAngle Number in radians
     * @param {number} innerRadius
     * @param {number} outerRadius
     */
    _allPointsWithinSegment(points, startAngle, endAngle, innerRadius, outerRadius){

        const anyPointOutOfBounds = points.some( point => {

            // edge case where point is exactly centered in a pie chart
            // and therefore always valid
            if (innerRadius === 0 && point.x === 0 && point.y === 0) return false

            const lineLength = Math.sqrt( Math.pow(point.x, 2) + Math.pow(point.y, 2))

            let failCondition = (
                lineLength === 0 ? 'line length === 0'
              : lineLength > outerRadius ? 'lineLength > outerRadius'
              : lineLength < innerRadius ? 'lineLength < innerRadius'
              : null
            )
            if (failCondition) console.log(failCondition)

            // point is outside radius bounds
            // -
            // zero line length here refers to a point at the centre of a donut chart
            // It's a case technically caught by by lineLength, but want to be sure to avoid
            // divide by 0 errors below
            if ( lineLength === 0 || lineLength > outerRadius || lineLength < innerRadius) return true

            const normalisedRads = Math.acos(Math.abs(point.y) / lineLength)
            const circle = Math.PI * 2;

            let lineAngle = (
                  point.x >= 0 && point.y < 0 ?                 normalisedRads // top right
                : point.x >= 0 && point.y >= 0 ? circle * 0.5 - normalisedRads // bottom right
                : point.x < 0 &&  point.y >= 0 ? circle * 0.5 + normalisedRads // bottom left
                : point.x < 0 &&  point.y < 0 ?  circle       - normalisedRads // top left
                : null
            )

            failCondition = (
                lineAngle === null ? 'lineAngle === null'
              : lineAngle < startAngle ? 'lineAngle < startAngle'
              : lineAngle > endAngle ? 'lineAngle > endAngle'
              : null
            )
            if (failCondition) console.log(failCondition)

            // angle is invalid or out of bounds
            if (lineAngle === null || lineAngle < startAngle || lineAngle > endAngle ) return true

            // debug - draw line
            // d3.select('.pie')
            //     .append('polyline')
            //     .style('stroke-width', '1px')
            //     .style('stroke', 'rgba(0,0,0,0.3)')
            //     .attr('points', [[0,0], [point.x,point.y]])
        })

        return !anyPointOutOfBounds
    }

    _addCentreLabel(innerRadius) {

        let xText = this.xAxisLabel();
        let yText = this.yAxisLabel();

        const hasYText = yText || yText === 0;
        const hasXText = xText || xText === 0;

        if (hasXText) xText = xText && xText.short || xText;
        if (hasYText) yText = yText && yText.short || yText;

        const centreText = this._appendIfEmpty(this._element.select('.pie'), 'g', 'centre-label')
            .style('font-family', 'sans-serif')
            .style('font-size', this._font_size + 'px')
            .attr('text-anchor', 'middle');

        if (!hasXText && !hasYText){
            centreText.remove();
            return
        }

        const ySpan = this._appendIfEmpty(centreText, 'text', 'y');
        const xSpan = this._appendIfEmpty(centreText, 'text', 'x');

        // populate spans or remove unneeded
        hasYText
            ? ySpan
                .attr('y', hasXText ? '-0.3em' : '0.3em')
                .text(yText)
            : ySpan
                .remove();

        hasXText
            ? xSpan
                .attr('y', hasYText ? '1em' : '0.3em')
                .attr('x', '0')
                .text(xText)
            : xSpan
                .remove();

        if (hasYText) {
            const yLabelPoints = this._getSegmentLabelBoundingPoints(ySpan, [0,0]);
            const yLabelOutOfBounds = !this._allPointsWithinSegment(yLabelPoints, 0, 2 * Math.PI, 0, innerRadius);
            console.log('yLabelExtendsBeyondCentre', yLabelOutOfBounds)
        }
        if (hasXText) {
            const xLabelPoints = this._getSegmentLabelBoundingPoints(xSpan, [0,0]);
            const xLabelOutOfBounds = !this._allPointsWithinSegment(xLabelPoints, 0, 2 * Math.PI, 0, innerRadius);
            console.log('xLabelExtendsBeyondCentre', xLabelOutOfBounds)
        }

    }

    _renderSegmentPaths(pie, segments, arc) {
        const segmentWrapper = this._appendIfEmpty(pie, 'g', 'segments');
        const paths = segmentWrapper.selectAll('.segment')
            .data(segments, d => d.data._x);

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
        const pieCentre = [availableWidth/2 + widestLabelWidth, minDimension/2 + labelHeight]

        pie.attr("transform", `translate(${pieCentre[0]},${pieCentre[1]})`)

        const data = this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val));

        const innerRadius = this.isDonut() ? minDimension / 4 : 0;
        const outerRadius = minDimension / 2;

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const labelArc = this.isDonut()
            ? arc
            : d3.arc()
                .innerRadius(minDimension / 6)
                .outerRadius(outerRadius)

        const outerArc = d3.arc()
            .innerRadius(outerRadius + 10)
            .outerRadius(outerRadius + 10)

        const segments = d3.pie().value(this.y())(data);

        const midAngle = d => d.startAngle + (d.endAngle - d.startAngle)/2;

        this._renderSegmentPaths(pie, segments, arc)

        const segmentLabelsWrapper = this._appendIfEmpty(pie, 'g', 'segment-labels').style('font-family', 'sans-serif');

        const segmentLabels = segmentLabelsWrapper.selectAll('.segment-label')
            .data(segments, d => d.data._x);

        const labelSizes = [];

        segmentLabels.enter()
            .append('g')
            .attr('class', 'segment-label')
            .merge(segmentLabels)
            .each((segment, i, nodes) => {

                const labelWrapper = d3.select(nodes[i]);
                const text = this._appendIfEmpty(labelWrapper, 'g', 'label-wrapper');

                const textColour = useOutsideLabels
                    ? d3.hcl(colours.eighteen.darkGrey).brighter()
                    : this._getOverlayLabelColour(segment);

                text.attr('pointer-events', 'none')
                    .attr('fill', textColour)
                    .style('font-size', this._font_size + 'px')

                const xLabel = this._appendIfEmpty(text, 'text', 'x-label');
                const yLabel = this._appendIfEmpty(text, 'text', 'y-label');

                let xLabelText = this.formatX()(this.x()(segment.data));
                xLabel
                    .attr("y", this.showLabels() ? "-0.3em" : "0.3em")
                    .text(xLabelText);

                if (!useOutsideLabels){
                    const radians = segment.endAngle - segment.startAngle;
                    const arcLength = radians * outerRadius;
                    maxLabelWidth = arcLength;

                    // TODO: use this
                    // const points = this._getSegmentLabelBoundingPoints(xLabel, labelArc.centroid(segment));
                    // const isWithinSegment = this._allPointsWithinSegment(points, segment, arc);

                     /*

                        if xspan width > available width  && ytext has spaces
                            try x line wrap
                            split in half by spaces (closest to center space)
                            re-add spans in correct y position
                            measure spans
                            ... same for yspan

                        */
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
                        .attr("y", "1em")
                        .text(this.formatLabel()(this.y()(segment.data)));
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
                                pos[0] = outerRadius * 1.09 * (midAngle(dInt) < Math.PI ? 1 : -1);
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

                const finalPos = outerArc.centroid(segment);
                const rightHandSide = midAngle(segment) < Math.PI;
                const rect = text.node().getBoundingClientRect();

                labelSizes[segment.index] = {y: finalPos[1], height: rect.height, rightHandSide};

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
                                terminal[0] = outerRadius * 1.05 * (leftAligned ? 1 : -1);
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
            .each((segment, i, nodes) => {
                const labelWrapper = d3.select(nodes[i]);
                const label = labelWrapper.select('text');
                if (useOutsideLabels){
                    let hide = label.node().getBBox().width > maxLabelWidth;
                    if (!hide && segment.index !== 0 && this.useOutsideLabels()){ // skip first label
                        const thisLabel = labelSizes[segment.index];
                        const previousLabel = labelSizes[segment.index - 1];

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
                    const points = this._getSegmentLabelBoundingPoints(label, labelArc.centroid(segment));
                    const isWithinSegment = this._allPointsWithinSegment(points, segment.startAngle, segment.endAngle, innerRadius, outerRadius);
                    labelWrapper.style('visibility', isWithinSegment ? null : 'hidden');
                }
            })

        segmentLabels.exit().remove();

        this.isDonut()
            ? this._addCentreLabel(innerRadius)
            : this._element.select('.centre-label').remove();
    }

}

export function pie() {
    return new Pie();
}