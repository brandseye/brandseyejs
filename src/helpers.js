/**
 * Given an array of text, this places things in the DOM to figure out how
 * much pixel space the text takes up.
 */
export function maxBounding(selection, text, font, fontSize) {
    font = font || "Open Sans, sans-serif";
    fontSize = fontSize || "12";

    let width = 0;
    let height = 0;
    selection.append("g")
            .attr("class", "text-size")
            .style("opacity", 0)
            .attr("transform", "translate(-100, -100)")
        .selectAll(".text-measurement")
        .data(text)
        .enter()
        .append("text")
        .text(d => d)
            .style("font-family", font)
            .style("font-weight", "normal")
            .style("font-size", fontSize + "px")
        .each((d, i, nodes) => {
            let node = nodes[i];
            let bb = node.getBBox();
            width = Math.max(width, bb.width);
            height = Math.max(height, bb.height)
        });

    selection.select("text-size").remove();
    return {
        width: width,
        height: height
    }
}