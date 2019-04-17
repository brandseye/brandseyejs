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

import { Geometry } from './Geometry';
import { toColourKey } from "../Legend";
import { equals } from "../helpers";


class Line extends Geometry {

    constructor() {
        super("LINE", 2);
    }

    render() {
        const element = this._element;
        const data = this.prepareData();
        const width = this._width,
              height = this._height;
        const allData = data.map(d => d.data).reduce((acc, val) => acc.concat(val));

        element.classed("line-chart", true);


        const x = this.getD3XScale(allData, width);
        const y = this.getD3YScale(allData, height);
        const invert = d3.scaleQuantize().domain(x.range()).range(x.domain());

        //---------------------------------
        // append the lines
        let lineGroup = element.select(".lines");
        lineGroup.selectAll("circle").remove();

        let circle = false;
        let lastMouse = null;
        let lastMin = null;

        if (lineGroup.empty()) {
            lineGroup = element
                .append("g")
                .attr("class", "lines")
                .attr("width", this.width())
                .attr("height", this.height());

            // This is needed to provide area for mouse interactions.
            lineGroup
                .append("rect")
                .style("opacity", "0")
                .attr("width", "100%")
                .attr("height", "100%");
        }

        if (this.scaleX().isContinuous()) {
            lineGroup
                .on("mousemove", (d, i, nodes) => { // Darken the bar on mouse over
                    const mouse = d3.mouse(nodes[i]);

                    const xval = invert(mouse[0]);
                    const yval = y.invert(mouse[1]);
                    // let min = this.getClosestPoint(xval, yval, this.getTransformedData()[0].data);

                    let mins = data.map(d => getClosestPoint(xval, yval, d.data));
                    mins.forEach(d => d._dist =  [x(d._x), y(d._y)]);

                    mins = mins.filter(min => {
                        const minScreenDist = Math.sqrt((mouse[0] - min._dist[0]) ** 2 + (mouse[1] - min._dist[1]) ** 2);
                        min._min_screen = minScreenDist;
                        return minScreenDist < 100;
                    });


                    if (!mins || !mins.length) {
                        lastMouse = null;
                        lineGroup.selectAll("circle").remove();
                        return;
                    }

                    mins = mins.sort((lhs, rhs) => lhs._min_screen - rhs._min_screen);
                    let min = mins[0];

                    if (circle) {
                        if (lastMin && min._x.getTime() === lastMin._x.getTime()) return;
                        lineGroup.selectAll("circle").remove();
                    }

                    circle = true;
                    lastMouse = mouse;
                    lastMin = min;
                    lineGroup
                        .append("circle")
                        .attr("cx", x(min._x) + x.bandwidth() / 2)
                        .attr("cy", y(min._y))
                        .attr("r", 10)
                        .attr("fill", this.getD3Colour(d))
                        .style("opacity", 0.1)
                        .on("contextmenu", () => d3.event.preventDefault()) // No right click.
                        .on("click auxclick", (d, i, nodes) => {
                            this._dispatch.call("elementClick", this, {
                                e: d3.event,
                                point: min,
                                series: data[min._s_i],
                                seriesIndex: min._s_i,
                                value: min._y
                            })
                        })
                        .on("mouseover", () => {
                            this._dispatch.call("tooltipShow", this, {
                                e: d3.event,
                                point: min,
                                series: data[min._s_i],
                                seriesIndex: min._s_i,
                                value: min._y
                            })
                        })
                        .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
                            this._dispatch.call("tooltipHide", this);
                        })
                        .transition()
                        .style("opacity", 0.5)

                });
        }

        let lines = lineGroup.selectAll('.line');
        lines = lines.data(data, d => d._key);

        lines.exit()
             .transition()
             .style("opacity", 0)
             .on("end", (d, i, nodes) => d3.select(nodes[i]).remove());

        const line = d3.line()
                       .x(d => x(d._x) + x.bandwidth() / 2)
                       .y(d => y(d._y));

        const determineStroke = d => d.data.length <= 1 ? 20 : 2;
        lines
            .enter()
            .each((d, i, nodes) => {
                console.log("d is", d);
            })
            .append("path")
                .attr("fill", "none")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .style("stroke-width", determineStroke) // Want to make a circle if we have a line with only a single data point
                .attr("stroke", d => d3.hcl(this.getD3Colour(d.data[0])).darker())
                .style("opacity", 0)
            .merge(lines)
                .attr("class", d => "line series series-" + toColourKey(d.data[0]._colour))
                .attr("stroke", d => d3.hcl(this.getD3Colour(d.data[0])).darker())
                .style("stroke-width", determineStroke)
            .transition()
                .style("opacity", 1)
                .attr("d", d => line(d.data));

        lines
            .transition()
            .attr("d", d => line(d.data));


        element.selectAll(".domain-selector").remove();
        if (this.scaleX().isDiscrete()) {
            const selectors = element
                .selectAll(".domain-selector")
                .data(x.domain());

            selectors.enter()
                     .append("g")
                     .attr("class", "domain-selector")
                     .each((d, i, nodes) => {
                         const selector = d3.select(nodes[i]);
                         selector.append("rect")
                             .attr("x", d => x(d))
                             .attr("y", y.range()[1])
                             .attr("width", x.bandwidth() + "px")
                             .attr("height", Math.abs(y.range()[0] - y.range()[1]))
                             .style("fill", d3.color("#487329"))
                             .style("opacity", 0);

                         const STANDARD_OPACITY = 0.7;
                         const RADIUS = 10;

                         selector.on("mouseenter", d => {
                                 const rect = selector.select("rect");
                                 rect.interrupt("selector:highlight")
                                     .transition("selector:highlight")
                                     .duration(500)
                                     .style("opacity", 0.2);

                                 var inSelection = data
                                     .map(line => {
                                         return line.data.filter(p => {
                                             return equals(p._x, d);
                                         })
                                     })
                                     .flat();

                                 if (inSelection.length) {
                                     // this._dispatch.call("tooltipShow", this, {
                                     //     e: d3.event,
                                     //     point: inSelection[0],
                                     //     points: inSelection
                                     // });

                                     selector
                                         .selectAll(".line-highlight")
                                         .data(inSelection)
                                         .enter()
                                         .append("circle")
                                             .attr("class", "line-highlight")
                                             .attr("cx", d => x(d._x) + x.bandwidth() / 2)
                                             .attr("cy", d => y(d._y))
                                             .attr("r", 1)
                                             .style("cursor", "pointer")
                                             .style("opacity", 0)
                                             .style("fill", d => this.getD3Colour(d))
                                         .on("contextmenu", () => d3.event.preventDefault()) // No right click.
                                         .on("click auxclick", d => {
                                             this._dispatch.call("elementClick", this, {
                                                 e: d3.event,
                                                 point: d
                                             })
                                         })
                                         .on("mouseover", (d, i, nodes) => {
                                             this._dispatch.call("tooltipShow", this, {
                                                 e: d3.event,
                                                 point: d
                                             });

                                             d3.select(nodes[i])
                                               .interrupt()
                                               .transition()
                                               .style("opacity", 1)
                                               .attr("r", 15);
                                         })
                                         .on("mouseout", (d, i, nodes) => {
                                             d3.select(nodes[i])
                                               .interrupt()
                                               .transition()
                                               .style("opacity", STANDARD_OPACITY)
                                               .attr("r", RADIUS);
                                         })
                                         .transition()
                                             .delay(300)
                                             .duration(500)
                                             .attr("r", RADIUS)
                                             .style("opacity", STANDARD_OPACITY);
                                 }



                             })
                             .on("mouseleave", d => {
                                 const rect = selector.select("rect");
                                 rect.interrupt("selector:highlight")
                                     .transition()
                                     .style("opacity", 0);

                                 selector.selectAll(".line-highlight")
                                         .interrupt()
                                         .transition()
                                         .style("opacity", 0)
                                         .attr("r", 1)
                                         .on("end", (d, i, nodes) => d3.select(nodes[i]).remove());
                             });
                     })

        }
    }


    getD3XScale(data, width) {
        width = width || this.width();
        data = data || this.prepareData()
                           .map(d => d.data)
                           .reduce((acc, val) => acc.concat(val));


        return d3.scaleBand()
            .rangeRound([0, width])
            .domain(data.map(d => d._x));
    }

    getD3YScale(data, height) {
        data = data || this.prepareData()
                           .map(d => d.data)
                           .reduce((acc, val) => acc.concat(val));
        height = height || this.height();

        return d3.scaleLinear()
          .range([height, 0])
          .nice(5)
          .domain([Math.min(0, d3.min(data, d => d._y)), d3.max(data, d => d._y)]);

    }
}


function getClosestPoint(xval, yval, data) {
    let calcDist = d => Math.sqrt(Math.abs(d._x - xval) ** 2 + (d._y - yval) ** 2);
    let min = data[0];
    let minDist = calcDist(min);

    data.forEach(d => {
        let dist = calcDist(d);
        if (dist < minDist) {
            minDist = dist;
            min = d;
        }
    });

    return min;
}



export function line() {
    return new Line();
}