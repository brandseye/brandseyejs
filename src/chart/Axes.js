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

import {colours} from "../Colours";

const AXIS_ANIMATION_DURATION = 1000;
const AXIS_DELAY = 250;

function ensureOptions(o) {
    return Object.assign({
        fontSize: 12,
        gridLineOpacity: 0.2
    }, o)
}

function getMaxWidth(sel) {
    let max = 0
    sel.nodes().forEach(node => max = Math.max(max, node.getBBox().width))
    return max
}

function removeOverlappingXTicks(axis, labelWidth) {
    let a = axis.selectAll("g.tick").nodes()
    if (!a.length) return
    let px = a[0].getBoundingClientRect().x + labelWidth
    for (let i = 1; i < a.length; i++) {
        let node = a[i]
        let x = node.getBoundingClientRect().x
        if (x < px) node.parentNode.removeChild(node)
        else px = x + labelWidth // there is space for the label
    }
}

function adjustFirstXTickLabel(axis) {
    // move the first tick label right if it extends too far to the left as it might overlap the y-axis zero
    let tick = axis.select("g.tick")
    if (tick.empty()) return
    let t = tick.attr("transform")  // e.g. translate(8.327586206896552,0)
    let i = t.indexOf('(')
    let j = t.indexOf(',', i + 1)
    let x = parseFloat(t.substring(i + 1, j))
    let text = tick.select("text")
    x -= text.node().getComputedTextLength() / 2
    if (x < -8) text.attr("x", Math.abs(x + 6))
}

export function xaxis(selection, height, width, axisObject, importance, options) {
    options = ensureOptions(options)
    let { fontSize, gridLineOpacity } = options

    selection.select(".x-axis").remove();
    let axis = selection.append("g").attr("class", "x-axis").style("opacity", 0).call(axisObject)

    axis.select(".domain").remove();

    const regularText = d3.hcl(colours.eighteen.darkGrey).brighter();

    let text = axis.selectAll("text")
    text.style("font-size", fontSize + "px")
        .style("fill", regularText)

    let tv = axisObject.tickValues()
    if (tv) width *= axisObject.scale().domain().length / (tv.length + 1)

    let labelWidth = getMaxWidth(text) + 4
    if (labelWidth > width) {
        if (options.xLabelAngle !== 0) {
            const bad = labelWidth >= width * 2;
            const angle = bad ? -90 : -30;
            const x = bad ? -(fontSize * 0.78) : 0;
            const y = bad ? 5 : 2;

            text.style('text-anchor', 'end')
                .attr("transform", () => "translate(" + x + "," + y + ") rotate(" + angle + " 0,0)")

            labelWidth = fontSize * 1.2  // getBoundingClientRect doesn't seem to consider the rotation?
        } else {
            if (!options.hideYAxisMin) adjustFirstXTickLabel(axis)
        }
        if (options.hideXAxisMin) axis.select("text").remove()
        if (labelWidth > width) removeOverlappingXTicks(axis, labelWidth)
    } else {
        if (!options.hideYAxisMin) adjustFirstXTickLabel(axis)
        if (options.hideXAxisMin) axis.select("text").remove()
        if (tv) removeOverlappingXTicks(axis, labelWidth) // ticks might not be evenly spaced
    }

    axis.selectAll("line").style("opacity", gridLineOpacity)

    let tickSize = axisObject.tickSize();
    if (tickSize && options.axisBox) {
        let x = axisObject.scale().range()[1]
        axis.append("line").attr("x1", x).attr("x2", x).attr("y2", tickSize)
            .attr("opacity", gridLineOpacity).attr("stroke", "currentColor")
    }

    axis.transition().duration(AXIS_ANIMATION_DURATION).delay(AXIS_DELAY).style("opacity", 1)

    return axis.node().getBBox().height;
}

function removeOverlappingYTicks(axis, labelHeight) {
    let a = axis.selectAll("g.tick").nodes()
    if (!a.length) return
    let py = a[0].getBoundingClientRect().y - labelHeight
    for (let i = 1; i < a.length; i++) {
        let node = a[i]
        let y = node.getBoundingClientRect().y
        if (y > py) node.parentNode.removeChild(node)
        else py = y - labelHeight // there is space for the label
    }
}

export function yaxis(selection, axis, options) {
    options = ensureOptions(options)
    let { fontSize, gridLineOpacity } = ensureOptions(options)

    selection.select(".y-axis").remove();
    let y = selection.append("g")
                     .attr("class", "y-axis")
                     .call(axis)
                     .style("opacity", 0)
    y.select(".domain").remove() // this doubles up on the 0 tick line making it darker so nuke it

    if (options.axisBox) y.append("line").attr("y2", axis.scale().range()[0]).attr("stroke", "currentColor")

    let tickSize = axis.tickSize()
    if (tickSize && options.axisBox) y.append("line").attr("x2", -tickSize).attr("stroke", "currentColor")

    if (options.hideYAxisMin) y.select("text").remove()

    y.selectAll("text").style("font-size", fontSize + "px").style("fill", d3.hcl(colours.eighteen.darkGrey).brighter());
    y.selectAll("path").style("opacity", gridLineOpacity)
    y.selectAll("line").style("opacity", gridLineOpacity)

    if (!axis.scale().bandwidth) removeOverlappingYTicks(y, fontSize * 1.2)

    y.transition()
        .duration(AXIS_ANIMATION_DURATION)
        .delay(AXIS_DELAY)
        .style("opacity", 1);

    return y.node().getBBox().width + 20;
}

export function yGrid(selection, width, show, axis) {
    selection.select(".yGrid").remove();

    if (!show) return;

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

export function xGrid(selection, height, show, axis) {
    selection.select(".xGrid").remove();

    if (!show) return;

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

export function yAxisLabel(element, height, margins, label, options, y2x) {
    let { fontSize } = ensureOptions(options)

    let cls = y2x ? "y2-axis-label" : "y-axis-label"
    element.selectAll("." + cls).remove();

    if (!label) return;
    let text = label;
    if (text.long) text = text.long;

    let x = y2x || 20
    let y = -(margins.top + height / 2)

    let labelElement = element.append("g")
        .attr("class", cls)
        .append("text")
        .style("font-size", fontSize + "px")
        .text(text)
        .attr("transform", "rotate(-90 0,0) translate(" + y + "," + x + ")")
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

export function xAxisLabel(element, width, height, margins, label, options) {
    let { fontSize } = ensureOptions(options)

    element.selectAll(".x-axis-label").remove();

    if (!label) return;
    let text = label;
    if (text.long) text = text.long;

    let x = margins.left + width / 2;
    let y = margins.top + height + 40;

    let labelElement = element.append("g")
        .attr("class", "x-axis-label")
        .append("text")
        .style("font-size", fontSize + "px")
        .text(text)
        .attr("transform", "translate(" + x + ", " + y + ")")
        .style("fill", d3.hcl(colours.eighteen.darkGrey).brighter());

    let textWidth = labelElement.node().getBBox().width;
    if (textWidth >= height && label.short) {
        labelElement.text(label.short);
        textWidth = labelElement.node().getBBox().width;
    }

    labelElement.attr("dx", -textWidth / 2)
                .style("opacity", 0)
                .transition()
                .delay(AXIS_DELAY)
                .duration(AXIS_ANIMATION_DURATION)
                .style("opacity", 1)
}