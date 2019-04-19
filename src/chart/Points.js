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
import { colours } from "../Colours";


class Point extends Geometry {

    constructor() {
        super("POINT", 3);
    }

    render() {
        const element = this._element;
        const data = this.prepareData();
        const width = this._width,
              height = this._height;
        const allData = data.map(d => d.data).reduce((acc, val) => acc.concat(val));

        element.classed("points", true);
        console.log("point data is", data);



        const x = this.getD3XScale(allData, width);
        const y = this.getD3YScale(allData, height);

        console.log("x domain is", x.domain());

        let groups = element.selectAll('.point-groups');
        groups = groups.data(data, d => d._key);

        groups.exit().remove();

        groups.enter()
              .append("g")
              .attr("class", "point-groups")
              .merge(groups)
              .each((d, i, nodes) => {
                  console.log("Adding ze points");
                  const group = d3.select(nodes[i]);
                  const points = group.selectAll(".point")
                      .data(d.data, d => d._x + ":" + d._y);

                  points.exit()
                      .interrupt()
                      .transition()
                      .style("opacity", 0)
                      .attr("cy", y(0))
                      .on("end", (d, i, nodes) => d3.select(nodes[i]).remove());

                  const transparentColour = d3.hcl(colours.eighteen.darkGrey);
                  transparentColour.opacity = 0.8;
                  const determineStroke = d => d3.hcl(this.getD3Colour(d)).c < 20 ? transparentColour : "none";

                  points.interrupt("point:move")
                      .transition("point:move")
                      .duration(500)
                          .attr("cx", d => x(d._x))
                          .style("stroke", determineStroke)
                          .style("fill", d => this.getD3Colour(d));

                  points.enter()
                      .append("circle")
                          .attr("class", "point")
                          .style("opacity", 0)
                          .attr("cx", d => x(d._x))
                          .attr("cy", y(0))
                          .attr("r", 1)
                          .style("fill", d => this.getD3Colour(d))
                          .style("stroke", determineStroke)
                          .style("cursor", "pointer")
                          .on("contextmenu", () => d3.event.preventDefault()) // No right click.
                          .on("mouseover", (d, i, nodes) => {
                              this._dispatch.call("tooltipShow", this, {
                                  e: d3.event,
                                  point: d
                              });

                              const point = d3.select(nodes[i]);

                              point.interrupt("point:grow")
                                  .transition("point:grow")
                                  .duration(250)
                                  .style("opacity", 1)
                                  .attr("r", 10);
                          })
                          .on("mouseout", (d, i, nodes) => {
                              const point = d3.select(nodes[i]);

                              point.interrupt("point:grow")
                                  .transition("point:grow")
                                  .duration(250)
                                  .style("opacity", 0.5)
                                  .attr("r", 5);
                          })
                          .on("click auxclick", d => {
                              this._dispatch.call("elementClick", this, {
                                  e: d3.event,
                                  point: d
                              })
                          })
                      .merge(points)
                      .transition("point:grow")
                      .duration(800)
                      .delay(points.size() > 0 ? 200 : 0)
                        .attr("cy", d => y(d._y))
                        .style("opacity", 0.5)
                        .attr("r", 5);




              });
    }

    getD3XScale(data, width) {
        width = width || this.width();
        data = data || this.prepareData()
            .map(d => d.data)
            .reduce((acc, val) => acc.concat(val));

        console.log("prepare data data", data);

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


export function points() {
    return new Point();
}