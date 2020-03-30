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

    _addOutsideLabels(pie, arcs, arc, outerArc){

        if (pie.select(".outside-labels").empty()){
            pie.append('g').attr('class','outside-labels')
        }

        const labels = pie.select('.outside-labels')
            .selectAll('text')
            .data(arcs, d => d.data._x);

        function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        const radius = arc.outerRadius()();
        const textColour = d3.hcl(colours.eighteen.darkGrey).brighter();
        const lineColour = d3.hcl(textColour.h, textColour.c, textColour.l, 0.5);

        labels.enter()
            .append('text')
            .attr('pointer-events', 'none')
            .attr('fill', textColour)
            .each((d, i, nodes) => {
                const label = d3.select(nodes[i]);
                label.append('tspan')
                    .text(d => this.formatX()(this.x()(d.data)))
                    .attr('dy', this.showLabels() ? '-0.25em' : '0.25em')

                if (this.showLabels()){
                    label.append('tspan')
                        .text(d => this.formatLabel()(this.y()(d.data)))
                        .attr('dy', '1em')
                        .attr("x", "0")
                }
            })
            .merge(labels)
            .transition().duration(this._transition_duration)
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

        if (pie.select(".outside-lines").empty()){
            pie.append('g').attr('class', 'outside-lines');
        }

        var polyline = pie.select(".outside-lines").selectAll("polyline")
            .data(arcs, d => d.data._x);

        polyline.enter()
            .append("polyline")
            .attr('stroke', lineColour)
            .attr('stroke-width', '1px')
            .attr('fill', 'none')
            .style('mix-blend-mode', 'multiply')
            .merge(polyline)
            .transition().duration(this._transition_duration)
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

    _getWidthOfWidestLabel(){
        const allLabels = [
          ...this.xValues().map(xVal => this.formatX()(xVal)),
          ...this.yValues().map(yVal => this.formatLabel()(yVal))
        ];
        const text = this._element.select('.pie')
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
      const text = this._element.select('.pie')
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

    _addSegmentLabels(pie, arcs, arc){
        let segmentLabels = pie.select(".segment-labels");

        if (segmentLabels.empty()){
            segmentLabels = pie.append('g').attr('class','segment-labels')
        }

        const labels = segmentLabels
            .selectAll('text')
            .data(arcs, d => d.data._x)

        function midAngle(d){
          return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        const radius = arc.innerRadius()();

        labels.enter()
            .append("text")
            .attr('text-anchor', 'middle')
            .attr('pointer-events', 'none')
            // .style("opacity", 0)
            .each((d, i, nodes) => {
                const centroid = arc.centroid(d);
                const labelColour = this._getOverlayLabelColour(d);

                let label = d3.select(nodes[i])

                label
                    .append('tspan')
                    .text(this.formatX()(this.x()(d.data)))
                    .style("dy", this.showLabels() ? "-0.3em" : "0.3em")
                    .style("fill",labelColour);

                if (this.showLabels()){
                    label
                        .append('tspan')
                        .attr("dy", "1em")
                        .attr("x", "0")
                        .text(this.formatLabel()(this.y()(d.data)))
                        .style("fill", labelColour);
                }

                // const radians = d.endAngle - d.startAngle;
                // const radius = arc.innerRadius()();
                // const arcLength = radians * radius;
                // const bounding = label.node().getBBox();
                //
                // if (bounding.width < arcLength * 1.2) {
                //     // label.attr("dx", (bounding.width / 2));
                //     // label.attr("dy", -(bounding.height / 3));
                //
                //     label
                //         .transition()
                //         .duration(200)
                //         .style("opacity", 1)
                // }
            })
            .merge(labels)
            .transition().duration(this._transition_duration)
            .attrTween("transform", function(d) {
              this._current = this._current || d;
              const interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                const dInt = interpolate(t);
                return "translate(" + arc.centroid(dInt) + ")";
              };
            });

        labels.exit().remove();
    }

    _addCentreLabel(){
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

    isDonut(bool){
        if (arguments.length === 0) return this._is_donut;
        this._is_donut = bool;
        return this
    }

    useOutsideLabels(bool){
        if (arguments.length === 0) return this._use_outside_labels;
        this._use_outside_labels = bool;
        return this
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

        let pie = element.select('.pie');

        if(pie.empty()){
            pie = element.append('g').attr('class','pie')
        }

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

        pie.attr("transform", `translate(${availableWidth/2 + widestLabelWidth},${minDimension/2 + labelHeight})`)

        const data = this.prepareData(null, true).map(d => d.data).reduce((acc, val) => acc.concat(val));


        const arc = d3.arc()
          .innerRadius(this.isDonut() ? minDimension / 4 : 0)
          .outerRadius(minDimension / 2)

        const arcTween = function(a, i, nodes){
          var i = d3.interpolate(this._current, a);
          this._current = i(0);
          return t => arc(i(t));
        }

        const arcs = d3.pie().value(this.y())(data);

        let segments = pie.select('.segments');

        if (segments.empty()){
          segments = pie.append('g').attr('class','segments')
        }

        const paths = segments.selectAll('path')
          .data(arcs, d => d.data._x)

        paths
            .enter()
            .append('path')
            .each(function(d){this._current = d})
            .merge(paths)
            .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                d3.select(nodes[i])
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
                d3.select(nodes[i])
                  .interrupt("hover:colour")
                  .transition("hover:colour")
                  .duration(100)
                  .style("fill", d => this.getD3Colour(d.data))
                  .style("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker());
                this._dispatch.call("tooltipHide", this);
            })
            .style("fill", d => this.getD3Colour(d.data))
            .style("stroke", d => d3.hcl(this.getD3Colour(d.data)).darker())
            .transition().duration(this._transition_duration)
            .attrTween('d', arcTween)

        paths.exit().remove()

        // TODO: do this in a customisable way
        // const canUseOutsideLabels = this.width() / this.height() >= 1.5;

        const labelArc = this.isDonut()
          ? arc
          : d3.arc()
            .innerRadius(minDimension / 6)
            .outerRadius(minDimension / 2)

        if (this.useOutsideLabels()){ // && canUseOutsideLabels
            const outerArc = d3.arc()
              .innerRadius(minDimension / 2 + 10)
              .outerRadius(minDimension / 2 + 10)
            pie.select('.segment-labels').remove();
            this._addOutsideLabels(pie, arcs, labelArc, outerArc);
        } else {
            pie.select('.outside-labels').remove();
            pie.select('.outside-lines').remove();
            this._addSegmentLabels(pie, arcs, labelArc);
        }

        if (this.isDonut()){
            this._addCentreLabel();
        } else {
            this._element.select('.centre-label').remove();
        }
    }

}

export function pie() {
    return new Pie();
}