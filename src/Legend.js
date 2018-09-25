import {maxBounding} from "./helpers";
import {colours} from "./Colours";


export function renderLegend(element, data, min, width, height, getter) {
    element.selectAll(".legend").remove();
    getter = getter || (d => d._bucket);

    // Only if we have multiple series.
    if (!data || data.length < min) return 0;
    console.log("rebder is:", data);

    let maxWidth = maxBounding(element, data.map(getter)).width;

    const legend = element.append("g")
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
                       // .style("fill", () => this.getSeriesColour(i));

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
                element.selectAll(".series:not(.series-" + i + ")")
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

    const legendHeight = legend.node().getBBox().height;
    legend.attr("transform", "translate(0," + (height - legendHeight) + ")");
    return legendHeight;
}
