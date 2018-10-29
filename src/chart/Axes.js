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

import { colours } from "../Colours";

const AXIS_ANIMATION_DURATION = 1000;
const AXIS_DELAY = 250;


export function xaxis(selection, height, width, axisObject) {
    selection.select(".x-axis").remove();
    let axis = selection.append("g")
                        .attr("class", "x-axis")
                        .attr("transform", "translate(0," + height + ")")
                        .style("opacity", 0)
                        .call(axisObject);

    axis.select(".domain").remove();

    let max = 0;
    axis.selectAll("text")
        .style("fill", d3.hcl(colours.eighteen.darkGrey).brighter())
        .nodes()
        .forEach(text => max = Math.max(max, text.getBBox().width));

    if (max >= width - 10) {
        const bad = max >= width * 2;
        const angle = bad ? -90 : -30;
        const fontSize = width <= 13 ? 8 : 12;
        const x = bad ? -fontSize : 0;
        const y = bad ? 5 : 2;

        axis.selectAll("text")
            .style('text-anchor', 'end')
            .style("font-size", fontSize + "px")
            .attr("transform", () => "translate(" + x + "," + y + ") rotate(" + angle + " 0,0)")
    }

    axis
        .transition()
        .duration(AXIS_ANIMATION_DURATION)
        .delay(AXIS_DELAY)
        .style("opacity", 1);

    const axisHeight = axis.node().getBBox().height;
    axis.attr("transform", "translate(0," + (height - axisHeight) + ")");
    return axisHeight;
}

export function yaxis(selection, axis) {
    selection.select(".y-axis").remove();
    let y = selection.append("g")
                     .attr("class", "y-axis")
                     .call(axis.tickSize(0).tickPadding(10))
                     .style("opacity", 0);

    y.selectAll("text")
     .style("fill", d3.hcl(colours.eighteen.darkGrey).brighter());

    y.selectAll(".domain")
     .style("stroke", colours.eighteen.midGrey); // d3.hcl(colours.eighteen.darkGrey).brighter());

    const width = y.node().getBBox().width;
    y.attr("transform", "translate(" + width + ",0)");

    y.transition()
     .duration(AXIS_ANIMATION_DURATION)
     .delay(AXIS_DELAY)
     .style("opacity", 1);

    return width + 20;
}

export function yGrid(selection, width, axis) {
    selection.select(".yGrid").remove();

    let grid = selection.append("g")
                        .attr("class", "yGrid")
                        .call(axis
                            .tickSize(-width)
                            .tickFormat("")
                        );

    grid.selectAll("line")
        .style("stroke", colours.eighteen.lightGrey);
    grid.selectAll(".domain").remove();

    grid
        .lower() // Always ensure that this is earlier in the dom. Things must be drawn on top of it.
        .style("opacity", 0)
        .transition()
        .delay(AXIS_DELAY)
        .duration(AXIS_ANIMATION_DURATION)
        .style("opacity", 1);
}

export function xGrid(selection, height, axis) {
    selection.select(".xGrid").remove();

    let grid = selection.append("g")
                        .attr("class", "xGrid")
                        .call(axis
                            .tickSize(height)
                            .tickFormat("")
                        );

    grid.selectAll("line")
        .style("stroke", colours.eighteen.lightGrey);
    grid.selectAll(".domain").remove();

    grid
        .lower()
        .style("opacity", 0)
        .transition()
        .delay(AXIS_DELAY)
        .duration(AXIS_ANIMATION_DURATION)
        .style("opacity", 1);
}

export function yAxisLabel(element, height, margins, label) {
    element.selectAll(".y-axis-label").remove();

    if (!label) return;
    let text = label;
    if (text.long) text = text.long;

    let x = -(margins.top + height / 2);

    let labelElement = element.append("g")
                              .attr("class", "y-axis-label")
                              .append("text")
                              .text(text)
                              .attr("transform", "rotate(-90 0,0) translate(" + x + ", 20)")
                              .style("fill", d3.hcl(colours.eighteen.darkGrey).brighter());

    let width = labelElement.node().getBBox().width;
    if (width >= height && label.short) {
        labelElement.text(label.short);
        width = labelElement.node().getBBox().width;
    }

    labelElement.attr("dx", -width / 2)
        .style("opacity", 0)
        .transition()
        .delay(AXIS_DELAY)
        .duration(AXIS_ANIMATION_DURATION)
            .style("opacity", 1)
}