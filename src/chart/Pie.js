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
    constructor(name, isDonut, labelPlacement){
        super(name || 'PIE');
        this._is_donut = (typeof isDonut !== 'undefined' && isDonut !== null) ? isDonut : false;
        this._transition_duration = 200;
        this._line_height = 1.1;
        this._outside_labels_elbow_offset = 10;
        this._ellipsis = '...'; //\u2026
        this._colour = null;
        this._supported_label_placements = ['inside', 'outside', 'hybrid', 'legend'];
        if (this._supported_label_placements.indexOf(labelPlacement) === -1) {
            console.warn('Unsupported label placement', labelPlacement);
            this._label_placement = 'inside';
        } else {
            this._label_placement = labelPlacement;
        }
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
        .attr('dy', Math.round(this._font_size * this._line_height) + 'px')

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
        const w = bounds.width;
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

            // angle is invalid or out of bounds
            if (lineAngle === null || lineAngle < startAngle || lineAngle > endAngle ) return true

        })

        return !anyPointOutOfBounds
    }

    _renderSegmentLabel(labelWrapper, segment, labelSizes, outside) {
        const textWrapper = this._appendIfEmpty(labelWrapper, 'g', 'text-wrapper');
        const overlayColour = this._getOverlayLabelColour(segment);
        const textColour = outside
            ? d3.hcl(colours.eighteen.darkGrey).brighter()
            : overlayColour.colour;

        textWrapper.attr('pointer-events', 'none')
            .attr('fill', textColour)
            .style('mix-blend-mode', overlayColour.multiply ? 'multiply' : null)

        const labels = [this.formatX()(this.x()(segment.data))];
        if (this.showLabels()) labels.push(this.formatLabel()(this.y()(segment.data)));

        const isWithinSegment = label => {
            const boundingPoints = this._getLabelBoundingPoints(label, this._label_arc.centroid(segment));
            return this._allPointsWithinSegment(boundingPoints, segment.startAngle, segment.endAngle, this._inner_radius, this._outer_radius);
        }

        const isntTooWide = label => {
            return label.node().getBBox().width < this._max_label_width;
        }

        const testFn = outside ? isntTooWide : isWithinSegment;
        const strings = labels.map(l => l.toString());
        this._fitLabelsInSegment(strings, textWrapper, testFn, { tryLineWrap: !outside, keepTrailingString: this.showLabels() })

        this._transformSegmentLabel(textWrapper, outside)

        const finalPos = this._outer_arc.centroid(segment);
        const rightHandSide = this._getMidAngle(segment) < Math.PI;
        const rect = textWrapper.node().getBoundingClientRect();
        labelSizes[segment.index] = {y: finalPos[1], height: rect.height, rightHandSide};

        const line = this._appendIfEmpty(labelWrapper, 'polyline', 'label-line');
        if (outside) {
            this._renderLeaderLines(line)
        } else {
            line.remove();
        }
    }

    _getLastVisibleLabel(labelSizes, index) {
        const attempt = labelSizes[index];

        // step back until we hit
        // the start of the array
        // or a label not flagged as hidden
        return (
              typeof attempt === 'undefined' ? null
            : !attempt.isHidden ? attempt
            : this._getLastVisibleLabel(labelSizes, index - 1) // recurse
        )
    }

    _maybeHideLabel(labelWrapper, segment, labelSizes, outside) {
        const texts = labelWrapper.selectAll('text');

        let withinBounds = true;

        texts.each((string, i, nodes) => {
            const text = d3.select(nodes[i]);
            if (outside){
                let hide = text.node().getBBox().width > this._max_label_width;
                const thisLabel = labelSizes[segment.index];
                let lastVisibleLabel = this._getLastVisibleLabel(labelSizes, segment.index - 1);

                let ignore = segment.index === 0 || lastVisibleLabel === null || thisLabel.rightHandSide !== lastVisibleLabel.rightHandSide;
                if (!ignore && !hide){
                    if (thisLabel.rightHandSide) {
                        hide = (lastVisibleLabel.y + lastVisibleLabel.height) > thisLabel.y;
                    } else {
                        hide = ( thisLabel.y + thisLabel.height ) > lastVisibleLabel.y;
                    }
                }

                thisLabel.isHidden = hide;
                if (hide) withinBounds = false
            } else {
                const points = this._getLabelBoundingPoints(text, this._label_arc.centroid(segment));
                const isWithinSegment = this._allPointsWithinSegment(points, segment.startAngle, segment.endAngle, this._inner_radius, this._outer_radius);
                if (!isWithinSegment) withinBounds = false
            }
        })

        labelWrapper.style('visibility', withinBounds ? null : 'hidden');

        return !withinBounds

    }

    _toggleSegmentCallout(segmentIndices, on) {
        const segmentWrapper = this._pie.select('g.segments');

        segmentWrapper
            .selectAll(segmentIndices.map(idx => '.segment.index-'+idx).join(', '))
            .interrupt("callOutSegment")
            .transition("callOutSegment")
            .duration(on ? 50 : 120)
            .style('transform', on ? 'scale(1.05,1.05)' : 'scale(1,1)')
            .style('opacity', 1);

        segmentWrapper
            .selectAll('.segment' + segmentIndices.map(idx => ':not(.index-' + idx + ')').join(''))
            .interrupt("fadeSegment")
            .transition("fadeSegment")
            .duration(on ? 120 : 50)
            .style('opacity', on ? 0.3 : 1);
    }

    _renderLegend(segments) {
        const legend = this._appendIfEmpty(this._pie, 'g', 'legend').style('font-family', 'sans-serif');

        const labelSpacing = this._font_size/2;
        const labelHeight = this._font_size + labelSpacing;
        const maxItems = Math.min(segments.length, Math.floor(( this._height + labelSpacing ) / labelHeight) - 1); // - 1 for 'n more items' label
        const legendHeight = labelHeight * maxItems - labelSpacing;

        const visibleItems = []
        const overflowItems = []

        segments.forEach(segment => segment.index < maxItems ? visibleItems.push(segment) : overflowItems.push(segment));

        const legendItems = legend.selectAll('.legend-item')
            .data(visibleItems, d => d.data._x);

        legend
            .attr('transform', 'translate(' + (this._outer_radius + 20) + ',' + (-legendHeight / 2 + this._font_size) + ')')

        legendItems.enter()
            .append('g')
            .attr('class', segment => 'legend-item index-' + segment.index)
            .merge(legendItems)
            .each((segment, i, nodes) => {
                const labelWrapper = d3.select(nodes[i]);
                const labels = [this.formatX()(this.x()(segment.data))];
                if (this.showLabels()) labels.push(this.formatLabel()(this.y()(segment.data)));

                labelWrapper
                    .attr('transform', 'translate(0,' + segment.index * labelHeight +')')

                const isntTooWide = label => {
                    return label.node().getBBox().width < this._max_label_width;
                }

                // TODO: need a way to send multiple strings into a single line
                // currently, opinionated for outside labels, not legend
                // TODO: if the value is formatted with space as thousands separator, it risks being cut in half.
                this._fitLabelsInSegment([labels.join(', ')], labelWrapper, isntTooWide, { tryLineWrap: false, keepTrailingString: false }) // keepTrailingString: this.showLabels()

                // reset label fitting method
                labelWrapper.selectAll('text').attr('x', labelHeight/2 + 'px').attr('y',0)

                labelWrapper
                    .append('circle')
                    .attr('r', this._font_size/2)
                    .attr('cy', -labelHeight/4 + 'px')
                    .attr('fill', this.getD3Colour(segment.data))

                // hover target
                labelWrapper
                    .append('rect')
                    .attr('height', labelHeight + 'px')
                    .attr('fill', 'transparent')
                    .attr('y', -(labelHeight-this._font_size)*2)
                    .attr('width', this._max_label_width)

                labelWrapper
                    .style('cursor', 'pointer' )
                    .on('mouseover', () => {
                        legend.selectAll('.legend-item:not(.index-' + segment.index + ')')
                            .interrupt('legendItemFade')
                            .transition('legendItemFade')
                            .duration(50)
                            .style('opacity', 0.2)

                        this._toggleSegmentCallout([segment.index], true) ;
                        this._addCentreLabel(labels)
                    })
                    .on('mouseout', () => {
                        legend.selectAll('.legend-item:not(.index-' + segment.index + ')')
                            .interrupt('legendItemFade')
                            .transition('legendItemFade')
                            .duration(50)
                            .style('opacity', 1)

                        this._toggleSegmentCallout([segment.index], false)
                        this._addCentreLabel()
                    })
                //this._renderSegmentLabel(labelWrapper, segment, labelSizes, this._label_placement === 'outside')
            })

        if (overflowItems.length > 0) {
            const labels = [overflowItems.length + ' smaller items'];
            if (this.showLabels()) labels.push(overflowItems.reduce((acc, seg) => acc += this.scaleY().transform(this.y()(seg.data)), 0))

            legend
                .append('g')
                .attr('class', 'legend-item overflow-label')
                .attr('transform', 'translate(0,' + visibleItems.length * labelHeight +')')
                .style('cursor', 'pointer')
                .on('mouseover', () => {
                    this._toggleSegmentCallout(overflowItems.map(s => s.index), true) ;
                    this._addCentreLabel(labels)
                })
                .on('mouseout', () => {
                    this._toggleSegmentCallout(overflowItems.map(s => s.index), false)
                    this._addCentreLabel()
                })
                .append('text')
                .attr('x', labelHeight/2 + 'px')
                .style('font-size', this._font_size + 'px')
                .style('fill', '#999')
                .style('font-style', 'italic')
                .text(overflowItems.length + ' smaller items...')
        } else {
            legendItems.selectAll('.overflow-label').remove()
        }
    }


    _renderSegmentLabels(segments) {
        const segmentLabelsWrapper = this._appendIfEmpty(this._pie, 'g', 'segment-labels').style('font-family', 'sans-serif');

        const segmentLabels = segmentLabelsWrapper.selectAll('.segment-label')
            .data(segments, d => d.data._x);

        const labelSizes = [];

        const segmentsWithHiddenLabels = {};
        segmentLabels.enter()
            .append('g')
            .attr('class', 'segment-label')
            .merge(segmentLabels)
            .each((segment, i, nodes) => {
                const labelWrapper = d3.select(nodes[i]);
                this._renderSegmentLabel(labelWrapper, segment, labelSizes, this._label_placement === 'outside')
            })
            .each((segment, i, nodes) => {
               const labelWrapper = d3.select(nodes[i]);
               const hidden = this._maybeHideLabel(labelWrapper, segment, labelSizes, this._label_placement === 'outside');
               if (hidden) segmentsWithHiddenLabels[segment.data._key] = segment;
            })

            // second pass for hybrid setup
            // TODO: filter out labels that were rendered
            .each((segment, i, nodes) => {
                const hybrid = this._label_placement === 'hybrid';
                if (hybrid && segmentsWithHiddenLabels.hasOwnProperty(segment.data._key)){
                    const labelWrapper = d3.select(nodes[i]);
                    this._renderSegmentLabel(labelWrapper, segment, labelSizes, true)
                    labelWrapper.style('visibility', null);
                }
            })
            .each((segment, i, nodes) => {
                const hybrid = this._label_placement === 'hybrid';
                if (hybrid && segmentsWithHiddenLabels.hasOwnProperty(segment.data._key)){
                    const labelWrapper = d3.select(nodes[i]);
                    const hidden = this._maybeHideLabel(labelWrapper, segment, labelSizes, true);
                    if (hidden) segmentsWithHiddenLabels[segment.data._key] = segment;
                }
            })


        segmentLabels.exit().remove();

    }

    _renderLeaderLines(line) {
        const leaderArc = d3.arc()
            .innerRadius(this._outer_radius - 5)
            .outerRadius(this._outer_radius - 5);

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

    _transformSegmentLabel(text, outside) {
        const that = this;
        text
            .transition().duration(this._transition_duration)
            .attrTween("transform", function(arcData) {
                this._current = this._current || arcData;
                const interpolate = d3.interpolate(this._current, arcData);
                this._current = interpolate(0);

                return function(t) {
                    const dInt = interpolate(t);
                    if (outside){
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
                    return outside ? ( that._getMidAngle(dInt) < Math.PI ? 'start' : 'end' ) : 'middle';
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
     * @param {object} options
     */
    _fitLabelsInSegment(initialStrings, element, testFn, opts) {

        const defaultOptions = {
            tryLineWrap: true,
            maxAttempts: 5,
            keepTrailingString: false // for labels that contain a trailing value string that should be maintained
        }

        const options = Object.assign(defaultOptions, opts || {});

        let numAttempts = 0;

        let didFit = false
        let strings = initialStrings.slice()

        let newStrings = []
        let wrapFailed = false

        // loop lines
        while (!didFit && numAttempts < options.maxAttempts){

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
                .style('font-size', this._font_size + 'px')
                .attr('y',(string, i, nodes) => {
                    const lineHeightFactor = i - nodes.length/2 + 1;
                    return lineHeightFactor * Math.round(this._font_size * this._line_height) + 'px'
                })
                .each((string, i, nodes) => {
                    const text = d3.select(nodes[i]);
                    const keepLastString = options.keepTrailingString && i === nodes.length - 1;
                    if (testFn(text) || keepLastString){
                        newStrings.push(string);
                    } else if (options.tryLineWrap && !wrapFailed){
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
                            newStrings.push(i === 0 ? string : this._ellipsis)
                        }
                    }
                })
                .exit()
                .remove()

            let numEllipses = 0;
            newStrings = newStrings.filter((string, i, arr) => {
                const beginsWithEllipsis = string.trim().indexOf(this._ellipsis) === 0;
                if (string.indexOf(this._ellipsis) !== -1) numEllipses ++;

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

            // two ... is ... too many
            if (numEllipses > 1) newStrings = []

            const justEllipses = newStrings.filter(s => s === this._ellipsis).length;
            if (justEllipses === newStrings.length) newStrings = []

            if (this._arrayEquals(strings, newStrings) && !wrapFailed) wrapFailed = true;

            strings = newStrings;
            numAttempts += 1;
        }

        return numAttempts < options.maxAttempts && didFit

    }

    _addCentreLabel(labels) {

        if (!labels){
            let xText = this.xAxisLabel();
            let yText = this.yAxisLabel();

            const hasYText = yText || yText === 0;
            const hasXText = xText || xText === 0;

            labels = [];

            if (hasYText) labels.push(yText && yText.short || yText);
            if (hasXText) labels.push(xText && xText.short || xText);
        }

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

        const fitted = this._fitLabelsInSegment(strings, centreText, isWithinSegment, { tryLineWrap: true, maxAttempts: 10 } )

        centreText.style('visibility', fitted ? null : 'hidden')
    }

    _renderSegments(segments) {
        const segmentWrapper = this._appendIfEmpty(this._pie, 'g', 'segments');
        const paths = segmentWrapper.selectAll('.segment')
            .data(segments, d => d.data._x);

        const that = this;
        paths.enter()
          .append('path')
          .merge(paths)
          .attr('class', d => 'segment index-' + d.index)
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

    // no comparisons enabled for pie
    colour(colour) {
        if (arguments.length === 0) return this._colour;
        return this
    }

    isDonut(bool) {
        if (arguments.length === 0) return this._is_donut;
        this._is_donut = bool;
        return this
    }

    // TODO: deprecated
    useOutsideLabels(bool) {
        if (arguments.length === 0) return this._label_placement === 'outside';
        this._label_placement = bool ? 'outside' : 'inside';
        return this
    }

    // inside, outside, hybrid
    labelPlacement(labelPlacement) {
        if (arguments.length === 0) return this._label_placement;
        if (this._supported_label_placements.indexOf(labelPlacement) === -1) {
            console.warn('Unsupported label placement', labelPlacement);
            this._label_placement = 'inside';
        } else {
            this._label_placement = labelPlacement;
        }
        return this;
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
        let verticalSpaceNeeded = 0;

        this._max_label_width = availableWidth / 4;

        if (this._label_placement === 'hybrid') {
            this._max_label_width *= 0.75; // reserve less space than we would for fully outside labels
        }

        if (this._label_placement === 'legend') {
            this._max_label_width = availableWidth / 2 - 20;
        }

        if (this._label_placement === 'outside' || this._label_placement === 'hybrid' || this._label_placement === 'legend'){
            widestLabelWidth = Math.min(this._getWidthOfWidestLabel(), this._max_label_width);

            const labelHeight = this._getLabelHeight();
            const facetPadding = 20; // TODO: padding value from FantasticChart.js - does this need to be accessed more deliberately?
            if (this._label_placement === 'legend') {
                availableWidth -= widestLabelWidth;
            } else {
                verticalSpaceNeeded = this._outside_labels_elbow_offset * 2 + labelHeight - facetPadding;
                availableHeight -= verticalSpaceNeeded; // allow some bleed into padding in unusual cases
                availableWidth -= widestLabelWidth * 2;
            }
        }

        const minDimension = Math.min(availableWidth, availableHeight);

        /*
        Set up arcs
        */
        this._inner_radius = this._is_donut ? minDimension / 4 : 0;
        this._outer_radius = minDimension / 2;

        this._outer_arc = d3.arc()
            .innerRadius(this._outer_radius + this._outside_labels_elbow_offset)
            .outerRadius(this._outer_radius + this._outside_labels_elbow_offset)

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

        if (this._label_placement === 'legend') {
            this._pie.attr("transform", 'translate(' + this._outer_radius + ',' + (minDimension/2 + verticalSpaceNeeded/2) + ')')
        } else {
            this._pie.attr("transform", 'translate(' + (availableWidth/2 + widestLabelWidth) + ',' + (minDimension/2 + verticalSpaceNeeded/2) + ')');
        }

        this._renderSegments(segments);

        if(this._label_placement === 'legend'){
            this._element.select('.segment-labels').remove();
            this._renderLegend(segments);
        } else {
            this._element.select('.legend').remove();
            this._renderSegmentLabels(segments);
        }

        this._is_donut
            ? this._addCentreLabel()
            : this._element.select('.centre-label').remove();
    }

}

export function pie() {
    return new Pie();
}