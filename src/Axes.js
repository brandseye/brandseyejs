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

import {colours} from "./Colours";

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
    const fontSize = 12;
    axis.selectAll("text")
        .style("fill", colours.eighteen.darkGrey)
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
    let x = selection.append("g")
                     .attr("class", "y-axis")
                     .call(axis.tickSize(0).tickPadding(10))
                     .style("opacity", 0);

    x.selectAll("text")
     .style("fill", colours.eighteen.darkGrey);

    const width = x.node().getBBox().width;
    x.attr("transform", "translate(" + width + ",0)");

    x.transition()
     .duration(AXIS_ANIMATION_DURATION)
     .delay(AXIS_DELAY)
     .style("opacity", 1);

    return width;
}