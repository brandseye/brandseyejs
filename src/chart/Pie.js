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
        this._line_height = 1.1;
        this._ellipsis = '...'; //\u2026
    }

    _appendIfEmpty(appendTo, elementName, className) {
        let selection = appendTo.select('.' + className);
        if (selection.empty()) selection = appendTo.append(elementName).attr('class', className);
        return selection
    }

    _getOverlayLabelColour(d){
        const segmentColour = d3.hcl(this.getD3Colour(d.data));
        let labelColour = d3.hcl(colours.eighteen.darkGrey);
        let multiply = true;

        // invert
        if (segmentColour.l < 65) {
            labelColour.l += Math.min(labelColour.l + 50, 100);
            multiply = false
        }

        return { colour: labelColour, multiply: multiply }
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

    _getMidAngle(segment) {
        return segment.startAngle + (segment.endAngle - segment.startAngle)/2;
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

    _getLabelBoundingPoints(label, atPoint) {
        /*
        assumes:
        • label is centred around a given point. e.g.:
         - text-anchor: middle
         - left === atPoint[0] + width/2
         - top === atPoint[1] + height/2
        • label.node() is not a tspan
        */

        // consider x and y attribute
        const xOffset = parseFloat(label.attr('x') || 0);
        const yOffset = parseFloat(label.attr('y') || 0);

        const bounds = label.node().getBBox();
        const w = bounds.width; //label.node().getComputedTextLength();
        const h = bounds.height;
        const x = atPoint[0] + xOffset;
        const y = atPoint[1] + yOffset;

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

            /*
            let failCondition = (
                lineLength === 0 ? 'line length === 0'
              : lineLength > outerRadius ? 'lineLength > outerRadius'
              : lineLength < innerRadius ? 'lineLength < innerRadius'
              : null
            )
            if (failCondition) console.log(failCondition)
            */

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

            /*
            failCondition = (
                lineAngle === null ? 'lineAngle === null'
              : lineAngle < startAngle ? 'lineAngle < startAngle'
              : lineAngle > endAngle ? 'lineAngle > endAngle'
              : null
            )
            if (failCondition) console.log(failCondition)
            */

            // angle is invalid or out of bounds
            if (lineAngle === null || lineAngle < startAngle || lineAngle > endAngle ) return true

            // dev
            // if (showLines){
            //     d3.select('.pie')
            //         .append('polyline')
            //         .attr('class','dev')
            //         .style('stroke-width', '1px')
            //         .style('stroke', 'rgba(0,0,0,0.3)')
            //         .attr('points', [[0,0], [point.x,point.y]])
            // }
        })

        return !anyPointOutOfBounds
    }

    _renderSegmentLabel(labelWrapper, segment, labelSizes) {
        const textWrapper = this._appendIfEmpty(labelWrapper, 'g', 'text-wrapper');
        const overlayColour = this._getOverlayLabelColour(segment);
        const textColour = this._use_outside_labels
            ? d3.hcl(colours.eighteen.darkGrey).brighter()
            : overlayColour.colour;

        textWrapper.attr('pointer-events', 'none')
            .attr('fill', textColour)
            .style('mix-blend-mode', overlayColour.multiply ? 'multiply' : null)
            .style('font-size', this._font_size + 'px');

        const labels = [this.formatX()(this.x()(segment.data))];
        if (this.showLabels()) labels.push(this.formatLabel()(this.y()(segment.data)));

        const isWithinSegment = label => {
            const boundingPoints = this._getLabelBoundingPoints(label, this._label_arc.centroid(segment));
            return this._allPointsWithinSegment(boundingPoints, segment.startAngle, segment.endAngle, this._inner_radius, this._outer_radius);
        }

        const isntTooWide = label => {
            return label.node().getBBox().width < this._max_label_width;
        }

        const testFn = this._use_outside_labels ? isntTooWide : isWithinSegment;
        const strings = labels.map(l => l.toString());
        this._fitLabelsInSegment(strings, textWrapper, testFn, !this._use_outside_labels)

        this._transformSegmentLabel(textWrapper)

        const finalPos = this._outer_arc.centroid(segment);
        const rightHandSide = this._getMidAngle(segment) < Math.PI;
        const rect = textWrapper.node().getBoundingClientRect();
        labelSizes[segment.index] = {y: finalPos[1], height: rect.height, rightHandSide};

        this._renderLeaderLines(labelWrapper)
    }

    _hideOutOfBoundLabels(labelWrapper, segment, labelSizes) {
        const texts = labelWrapper.selectAll('text');

        let withinBounds = true;

        texts.each((string, i, nodes) => {
            const text = d3.select(nodes[i]);
            if (this._use_outside_labels){
                let hide = text.node().getBBox().width > this._max_label_width;
                if (!hide && segment.index !== 0 && this._use_outside_labels){ // skip first label
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
                if (hide) withinBounds = false
            } else {
                const points = this._getLabelBoundingPoints(text, this._label_arc.centroid(segment));
                const isWithinSegment = this._allPointsWithinSegment(points, segment.startAngle, segment.endAngle, this._inner_radius, this._outer_radius, string === '351');
                // console.log(string, isWithinSegment)
                if (!isWithinSegment) withinBounds = false
            }
        })

        labelWrapper.style('visibility', withinBounds ? null : 'hidden');


    }

    _renderSegmentLabels(segments) {
        const segmentLabelsWrapper = this._appendIfEmpty(this._pie, 'g', 'segment-labels').style('font-family', 'sans-serif');

        const segmentLabels = segmentLabelsWrapper.selectAll('.segment-label')
            .data(segments, d => d.data._x);

        const labelSizes = [];

        segmentLabels.enter()
            .append('g')
            .attr('class', 'segment-label')
            .merge(segmentLabels)
            .each((segment, i, nodes) => {
                const labelWrapper = d3.select(nodes[i]);
                this._renderSegmentLabel(labelWrapper, segment, labelSizes)
            })
            // hide intersecting or too-wide labels
            // giving preference to labels a lower arc index
            // only do this for outside labels for now
            .each((segment, i, nodes) => {
               const labelWrapper = d3.select(nodes[i]);
               this._hideOutOfBoundLabels(labelWrapper, segment, labelSizes);
            })

        segmentLabels.exit().remove();
    }

    _renderLeaderLines(labelWrapper) {
        const leaderArc = d3.arc()
            .innerRadius(this._outer_radius - 5)
            .outerRadius(this._outer_radius - 5);

        const line = this._appendIfEmpty(labelWrapper, 'polyline', 'label-line');
        if (!this._use_outside_labels) {
            line.remove()
        } else {
            const that = this;
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
                        var start = leaderArc.centroid(d2);
                        var elbow = that._outer_arc.centroid(d2);
                        var terminal = that._outer_arc.centroid(d2);
                        const leftAligned = that._getMidAngle(d2) < Math.PI;
                        terminal[0] = that._outer_radius * 1.05 * (leftAligned ? 1 : -1);
                        const positions = [start, elbow];
                        if (leftAligned ? terminal[0] > elbow[0] : elbow[0] > terminal[0]){
                            positions.push(terminal);
                        }
                        return positions;
                    };
                });
        }
    }

    _transformSegmentLabel(text) {
        const that = this;
        text
            .transition().duration(this._transition_duration)
            .attrTween("transform", function(arcData) {
                this._current = this._current || arcData;
                const interpolate = d3.interpolate(this._current, arcData);
                this._current = interpolate(0);

                return function(t) {
                    const dInt = interpolate(t);
                    if (that._use_outside_labels){
                        const pos = that._outer_arc.centroid(dInt);
                        pos[0] = that._outer_radius * 1.09 * (that._getMidAngle(dInt) < Math.PI ? 1 : -1);
                        return "translate("+ pos +")";
                    } else {
                        return "translate(" + that._label_arc.centroid(dInt) + ")";
                    }
                };
            })
            .styleTween("text-anchor", function(arcData){
                this._current = this._current || arcData;
                const interpolate = d3.interpolate(this._current, arcData);
                this._current = interpolate(0);

                return function(t) {
                    const dInt = interpolate(t);
                    return that._use_outside_labels ? ( that._getMidAngle(dInt) < Math.PI ? 'start' : 'end' ) : 'middle';
                }
            })
    }

    _splitInHalfByNearestSpace(string) {

        const minChars = 3

        if (string.indexOf(' ') === -1){
            return [string]
        }

        const halfIndex = Math.floor(string.length/2);
        const maxIndex = string.length - 1;
        let preIndex = string.slice(0, halfIndex + 1).lastIndexOf(' ');
        let postIndex = string.slice(halfIndex).indexOf(' ');

        preIndex = preIndex === -1 ? maxIndex : preIndex
        postIndex = postIndex === -1 ? maxIndex : postIndex + halfIndex

        const preferredIndex = Math.min(
            preIndex  !== -1 && halfIndex - preIndex > minChars ? maxIndex : preIndex,
            postIndex !== -1 && maxIndex - postIndex < minChars ? maxIndex : postIndex
        );

        if ( preferredIndex < maxIndex - minChars && preferredIndex >= minChars){
            return [ string.slice(0, preferredIndex), string.slice(preferredIndex + 1) ]
        }

        return [string]
    }

    _getTruncatedText(text, truncSize) {
        const minChars = 3;

        const words = text.split(' ');
        words.splice(Math.ceil(words.length / 2) - Math.floor(truncSize / 2), truncSize, this._ellipsis);
        const truncatedText = words.join(' ');
        const labelLength = truncatedText.length;

        if (labelLength - this._ellipsis.length < minChars) {
            return text
        } else {
            return truncatedText
        }
    }

    _arrayEquals(a, b) {
        if (a === b) return true
        if (a === null || b === null || a.length !== b.length) return false
        a.forEach((item, index) => { if (item !== b[index]) return false } )
        return true
    }

    /**
     *
     * @param {string[]} strings
     * @param {object} element
     * @param {function} testFn
     */
    _fitLabelsInSegment(initialStrings, element, testFn, tryLineWrap, maxAttempts) {
        if (typeof maxAttempts !== 'undefined' && (typeof maxAttempts !== 'number' || parseInt(maxAttempts) !== maxAttempts)){
            console.error('maxAttempts should be an integer')
        }

        let numAttempts = 0;
        maxAttempts = maxAttempts || 5;

        let didFit = false
        let strings = initialStrings.slice()

        // let attempts = [];
        let newStrings = []
        let wrapFailed = false

        // loop lines
        while (!didFit && numAttempts < maxAttempts){

            didFit = true;

            element.selectAll('text').remove();

            let texts = element.selectAll('text');

            newStrings = [];

            texts
                .data(strings)
                .enter()
                .append('text')
                .merge(texts)
                .text(string => string)
                .attr('y',(string, i, nodes) => {
                    const lineHeightFactor = i - nodes.length/2 + 1;
                    return lineHeightFactor * this._font_size * this._line_height +'px'
                })
                .each((string, i, nodes) => {
                    const text = d3.select(nodes[i]);
                    if (testFn(text)){
                        newStrings.push(string);
                    } else if (tryLineWrap && !wrapFailed){ //&& strings.length < 3
                        didFit = false
                        // split into strings for next iteration
                        const words = this._splitInHalfByNearestSpace(string)
                        words.forEach(s => newStrings.push(s))
                    } else {
                        // try truncation
                        let truncSize = 0
                        while( truncSize < string.length) {
                            const truncatedText = this._getTruncatedText(string, truncSize);
                            if (truncatedText === string ){
                                didFit = false
                                newStrings.push(i === 0 ? string : this._ellipsis)
                                break
                            }
                            text.text(truncatedText)
                            if(testFn(text)) {
                                // text fits, continue
                                newStrings.push(truncatedText)
                                break
                            } else {
                                truncSize += 1
                            }
                        }
                        if (truncSize === string.length){
                            didFit = false
                            // if ( i === 0 ) console.log(string, 'i == 0')
                            newStrings.push(i === 0 ? string : this._ellipsis)
                        }
                    }
                })
                .exit()
                .remove()

            // attempts.push(strings);

            const numEllipses = 0;
            newStrings = newStrings.filter((string, i, arr) => {
                const beginsWithEllipsis = string.trim().indexOf(this._ellipsis) === 0;

                if (beginsWithEllipsis && i === 0){
                    return false
                }

                // follows ellipsis in prev string
                const prevString = (arr[i - 1] || '').trim();
                const prevStringEndsWithEllipsis = prevString && prevString.indexOf(this._ellipsis) === prevString.length - this._ellipsis.length;
                if (beginsWithEllipsis && prevStringEndsWithEllipsis){
                    return false
                }
                return true
            })

            if (numEllipses > 1) newStrings = []

            const justEllipses = newStrings.filter(s => s === this._ellipsis).length;
            if (justEllipses === newStrings.length) newStrings = []

            // console.log(newStrings)
            // console.log(' ')

            if (this._arrayEquals(strings, newStrings) && !wrapFailed) wrapFailed = true;

            strings = newStrings;
            numAttempts += 1;
        }

        // console.log(attempts)

        return numAttempts < maxAttempts && didFit

    }

    _addCentreLabel() {

        let xText = this.xAxisLabel();
        let yText = this.yAxisLabel();

        const hasYText = yText || yText === 0;
        const hasXText = xText || xText === 0;

        const labels = [];

        if (hasYText) labels.push(yText && yText.short || yText);
        if (hasXText) labels.push(xText && xText.short || xText);

        const centreText = this._appendIfEmpty(this._pie, 'g', 'centre-label')
            .style('font-family', 'sans-serif')
            .style('font-size', this._font_size + 'px')
            .attr('text-anchor', 'middle');

        if (labels.length === 0){
            centreText.remove();
            return
        }

        const isWithinSegment = label => {
            const boundingPoints = this._getLabelBoundingPoints(label, [0,0])
            return this._allPointsWithinSegment(boundingPoints, 0, 2 * Math.PI, 0, this._inner_radius)
        }

        const strings = labels.map(l => l.toString());

        const fitted = this._fitLabelsInSegment(strings, centreText, isWithinSegment, true, 10 )

        centreText.style('visibility', fitted ? null : 'hidden')
    }

    _renderSegments(segments) {
        const segmentWrapper = this._appendIfEmpty(this._pie, 'g', 'segments');
        const paths = segmentWrapper.selectAll('.segment')
            .data(segments, d => d.data._x);

        const that = this;
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
          .style("cursor", "pointer")
          .attrTween('d', function(p,pi,pnodes){
              var pInt = d3.interpolate(this._current, p);
              this._current = pInt(0);
              return t => that._arc(pInt(t));
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

    getD3Colour(data) {
        let colour = Geometry.prototype.getD3Colour.call(this, data);
        if (this._tints) {
            colour = this._tints[data._key] || colour
        }
        return colour
    }

    immediatelyRenderLabels(show){
        this.showLabels(!!show);
        this.render();
    }

    render() {

        const data = this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val), []);

        /*
        Set up dimensions
        */
        let availableWidth = this._width;
        let availableHeight = this._height;

        let widestLabelWidth = 0;
        let labelHeight = 0;

        this._max_label_width = availableWidth / 4;

        if (this._use_outside_labels){
          widestLabelWidth = Math.min(this._getWidthOfWidestLabel(), this._max_label_width);
          labelHeight = this._getLabelHeight();
          availableWidth -= widestLabelWidth * 2;
          availableHeight -= labelHeight * 2;
        }

        const minDimension = Math.min(availableWidth, availableHeight);

        /*
        Set up arcs
        */
        this._inner_radius = this._is_donut ? minDimension / 4 : 0;
        this._outer_radius = minDimension / 2;

        this._outer_arc = d3.arc()
            .innerRadius(this._outer_radius + 10)
            .outerRadius(this._outer_radius + 10)

        this._arc = d3.arc()
            .innerRadius(this._inner_radius)
            .outerRadius(this._outer_radius);

        this._label_arc = this._is_donut
            ? this._arc
            : d3.arc()
                .innerRadius(minDimension / 5)
                .outerRadius(this._outer_radius)

        /*
            Prep tints if necessary
        */
        let firstColour;
        let useTintShift = true;
        // if we encounter more than one colour,
        // don't use tint shift
        for(let i = 0; i < data.length; i++) {
            const colour = Geometry.prototype.getD3Colour.call(this,data[i]);
            if (typeof firstColour === 'undefined'){
                firstColour = colour;
            } else if (colour !== firstColour) {
                useTintShift = false;
                break
            }
        }

        if (useTintShift) {
            const tints = [];
            const shiftLevels = 3; //in both directions
            const cycleLength = shiftLevels * 4;

            data.forEach((d, index) => {
                const colour = Geometry.prototype.getD3Colour.call(this, d);
                const shiftFactor = Math.abs( shiftLevels * 2 - Math.abs(index - shiftLevels) % cycleLength) - shiftLevels;
                tints.push(d3.hsl(colour).brighter(shiftFactor * 0.4));
                // TODO: test for black and white
                // TODO: consider zigzag palette within given hue
            })
            this._tints = tints;
        }

        const segments = d3.pie().value(this.y())(data);

        this._pie = this._appendIfEmpty(this._element, 'g', 'pie');

        this._pie.attr("transform", 'translate(' + (availableWidth/2 + widestLabelWidth) + ',' + (minDimension/2 + labelHeight) + ')')

        this._renderSegments(segments)

        this._renderSegmentLabels(segments)

        this._is_donut
            ? this._addCentreLabel()
            : this._element.select('.centre-label').remove();
    }

}

export function pie() {
    return new Pie();
}