import {maxBounding} from "./helpers";
import {colours as schema} from "./Colours";


export function renderLegend(element, buckets, colourScale, width, height, min) {
    min = min || 2;
    element.selectAll(".legend").remove();

    // Only if we have multiple series.
    if (!buckets || !buckets.colours.size) return 0;

    const colours = Array.from(buckets.colours);
    if (colours.length < min) return 0;

    const maxWidth = maxBounding(element, colours).width;

    const legend = element.append("g")
                          .attr("class", "legend");

    let elements = legend.selectAll(".legend-element")
                         .data(colours);

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
                       .style("fill", d => colourScale(d));

                element.append("text")
                       .text(d => d)
                       .attr("dx", 12)
                       .style("fill", schema.eighteen.darkGrey);

                element.append("title")
                       .text(d => d);

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

    const legendHeight = legend.node().getBBox().height;
    legend.attr("transform", "translate(0," + (height - legendHeight) + ")");
    return legendHeight;
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
 * @param colour
 * @param size
 * @returns {{colours: Set, sizes: Set}}
 */
export function buckets(data, colour, size) {
    if (!data || !data.length) return { colours: new Set(), sizes: new Set()};

    const byColour = new Set(),
          bySize = new Set();

    data.forEach(d => {
        byColour.add(colour(d));
        bySize.add(size(d));
    });

    return {
        colours: byColour,
        sizes: bySize
    }
}

export function toColourKey(colour) {
    // TODO this is not internationalised, and may break on things like brand names.
    return "colour-" + colour.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9]/g, '');
}