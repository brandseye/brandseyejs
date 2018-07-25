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

import {colours} from './Colours';
import { maxBounding } from "./helpers";



export class Chart {
    constructor() {
        this._x = (d) => d.x;
        this._y = (d) => d.y;
        this._height = 420;
        this._width = 420;
        this._BAR_GROWTH = 100;
        this._duration = 300;
        this._dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick',
            'tooltipShow', 'tooltipHide');
        this._xAxisTickFormat = this._tickFormat = this._labelFormat = d => d.toString();
        this._colours = [ colours.eighteen.midGrey, colours.eighteen.lightGrey, colours.eighteen.darkGrey ];
        this._backgroundColour = "#FFF";
    }

    renderLegend(svg, data, min, width, height, getter) {
        svg = svg || d3.select(this._element).select("svg");
        svg.selectAll(".legend").remove();
        if (!this._show_legend) return 0;

        min = min || 2;
        data = data || this.getSortedData();
        width = width || this._width;
        height = height || this._height;
        getter = getter || (d => d.key);

        // Only if we have multiple series.
        if (!data || data.length < min) return 0;

        let maxWidth = maxBounding(svg, data.map(getter)).width;

        const legend = svg.append("g")
            .attr("class", "legend");

        let elements = legend.selectAll(".legend-element")
            .data(data);

        const position_start = 20;
        let position = position_start;
        let position_height = 0;

        elements.enter()
            .append("g")
            .attr("class", (d, i) => "legend-element series series-" + i)
            .style("cursor", "default")
            .each((d, i, nodes) => {
                let element = d3.select(nodes[i]);

                element.append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .attr("y", -10)
                    .style("fill", () => this.getSeriesColour(i));

                element.append("text")
                    .text(getter)
                    .attr("dx", 12)
                    .style("font-family", "Open Sans, sans-serif")
                    .style("font-weight", "normal")
                    .style("font-size", "12px")
                    .style("fill", colours.eighteen.darkGrey);

                element.append("title")
                    .text(getter);

                element.attr("transform", "translate(" + position + "," + position_height +")");
                const positionDelta = maxWidth + 20; // element.node().getBBox().width + 10;
                position += positionDelta;

                if (position >= width) {
                    position = position_start;
                    position_height += 15;
                    element.attr("transform", "translate(" + position + "," + position_height + ")");
                    position += positionDelta;
                }

            })
            .on("mouseover", (d, i, nodes) => {
                svg.selectAll(".series:not(.series-" + i + ")")
                    .interrupt("legend:highlight")
                    .transition("legend:highlight")
                    .style("opacity", 0.3);
            })
            .on("mouseout", (d, i, nodes) => {
                svg.selectAll(".series")
                    .interrupt("legend:highlight")
                    .transition("legend:highlight")
                    .style("opacity", 1);
            })
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        const legendHeight = legend.node().getBBox().height;
        legend.attr("transform", "translate(0," + (height - legendHeight) + ")");
        return legendHeight;
    }
}