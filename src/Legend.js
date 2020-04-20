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

import {getBoundings} from "./helpers";
import {colours as schema} from "./Colours";

export function removeLegend(element) {
    element.selectAll(".legend").remove();
}

export function renderLegend(element, geomBuckets, colourScale, width, height, min, options) {
    if (!options) options = { }
    let fontSize = options.fontSize || 12

    min = min || 2;
    removeLegend(element);

    // Only if we have multiple series.
    if (!geomBuckets.find(b => b.colours.size)) return 0

    const legend = element.append("g").attr("class", "legend");

    let position = 0
    let position_height = 0
    let maxWidth = width - 40

    geomBuckets.forEach(buckets => {
        let gm = legend.append("g").attr("class", "geometry-legend")
        const colours = Array.from(buckets.colours);
        if (colours.length < min) return 0;

        const boundings = getBoundings(element, colours);

        let elements = gm.selectAll(".legend-element").data(colours);

        elements.enter()
            .append("g")
            .attr("class", (d, i) => "legend-element series series-" + toColourKey(d))
            .style("cursor", "default")
            .each((d, i, nodes) => {
                let element = d3.select(nodes[i]);

                element.append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .attr("y", -10)
                    .style("fill", d => colourScale(d, buckets));

                element.append("text")
                    .text(d => d)
                    .attr("dx", 12)
                    .style("font-size", fontSize + "px")
                    .style("fill", schema.eighteen.darkGrey);

                element.append("title")
                    .text(d => d);

                element.attr("transform", "translate(" + position + "," + position_height +")");
                const positionDelta = boundings[d].width + 25;
                position += positionDelta;

                if (position >= maxWidth) {
                    position = 0;
                    position_height += 15;
                    element.attr("transform", "translate(" + position + "," + position_height + ")");
                    position += positionDelta;
                }

            })
            .on("mouseover", (d, i, nodes) => {
                element.selectAll(".series:not(.series-" + toColourKey(d) + ")")
                    .interrupt("legend:highlight")
                    .transition("legend:highlight")
                    .style("opacity", 0.3);
            })
            .on("mouseout", (d, i, nodes) => {
                element.selectAll(".series")
                    .interrupt("legend:highlight")
                    .transition("legend:highlight")
                    .style("opacity", 1);
            })
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);
    })

    let bb = legend.node().getBBox()
    legend.attr("transform", "translate(" + ((width - bb.width)/2) + "," + (height - bb.height) + ")")
    return bb.height
}

/**
 * Given a data point, this determines its colours.
 * @param d
 * @param individualColours
 * @param colourScale
 * @returns {*}
 */
export function getColour(d, individualColours, colourScale) {
    return individualColours(d) || colourScale(d._colour);
}

/**
 * Figures out what buckets we may be using in our data set, based on
 * colour and size differentiation. This may have to be run for each
 * geom and merged.
 * @param data
 * @param colour    Fn to map a data point to a label e.g. 'First National Bank'
 * @param size
 */
export function buckets(data, colour, individualColour, size) {
    if (!data || !data.length) return { colours: new Set(), sizes: new Set()};

    const colours = new Set(),  // these are the labels e.g. 'First National Bank'
        sizes = new Set(),
        bucketColour = {};      // maps labels from colours to override colours e.g. 'First National Bank': "#00acb6"

    data.forEach(d => {
        const c = colour(d)     // c is the label e.g. 'First National Bank'
        colours.add(c)
        if (individualColour && individualColour(d, -1) !== -1) bucketColour[c] = individualColour(d)

        sizes.add(size(d));
    });

    return { colours, sizes, bucketColour }
}

export function toColourKey(colour) {
    // TODO this is not internationalised, and may break on things like brand names.
    colour = colour || "unknown-element";
    return "colour-" + colour.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9]/g, '');
}