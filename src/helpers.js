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


/**
 * Given an array of text, this places things in the DOM to figure out how
 * much pixel space the text takes up.
 */
export function maxBounding(selection, text, font, fontSize) {
    // font = font || "Open Sans, sans-serif";
    // fontSize = fontSize || "12";

    const boundings = getBoundings(selection, text, font, fontSize);

    let width = 0;
    let height = 0;

    Object.values(boundings).forEach(bounding => {
        if (bounding.width > width) width = bounding.width;
        if (bounding.height > height) height = bounding.height;
    });

    return {
        width: width,
        height: height
    }
}

export function getBoundings(selection, text, font, fontSize) {
    // font = font || "Open Sans, sans-serif";
    // fontSize = fontSize || "12";

    const boundings = {};
    selection.append("g")
             .attr("class", "text-size")
             .style("opacity", 0)
             .attr("transform", "translate(-100, -100)")
             .selectAll(".text-measurement")
             .data(text)
             .enter()
             .append("text")
             .text(d => d)
             .style("font-size", fontSize ? fontSize + "px" : null)
             .each((d, i, nodes) => {
                 const node = nodes[i];
                 const bb = node.getBBox();
                 boundings[d] = {
                     width: bb.width,
                     height: bb.height
                 };
             });

    selection.select(".text-size").remove();
    return boundings;
}



/** A test to whether a given data label is 0, or 0%. */
export function labelIsZero(label) {
    label = "" + label;
    return label === "0" || label === "0%" || label === "0.0%"
}

export function equals(lhs, rhs) {
    if (lhs instanceof Date && rhs instanceof Date) {
        return lhs.getTime() === rhs.getTime();
    }

    return lhs === rhs;
}

export function numCheck(v) { return typeof v === "number" ? v : 0 }
