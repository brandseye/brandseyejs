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
import { toColourKey } from "../Legend";


class Point extends Geometry {

    constructor() {
        super("POINT", 3);
    }

    render() {
        const element = this._element;
        const data = this.prepareData(null, true);
        const width = this._width,
              height = this._height;
        const allData = this.prepareData(null, false).map(d => d.data).reduce((acc, val) => acc.concat(val));

        element.classed("points", true);

        const x = this.getD3XScale(allData, width);
        const y = this.getD3YScale(allData, height);
        const sizeScale = this.getSizeScale(allData);

        let groups = element.selectAll('.point-groups');
        groups = groups.data(data, d => d._key);

        groups.exit().remove();

        groups.enter()
              .append("g")
              .attr("class", d => "point-groups series series-" + toColourKey(d.data[0]._colour))
              .merge(groups)
              .each((d, i, nodes) => {
                  const group = d3.select(nodes[i]);
                  const points = group.selectAll(".point")
                      .data(d.data, d => d._x);

                  const isFirstRender = !group.property("renderedOnce");
                  group.property("renderedOnce", true);
                  console.log("first render", isFirstRender);

                  const transparentColour = d3.hcl(colours.eighteen.darkGrey);
                  transparentColour.opacity = 0.8;
                  const determineStroke = d => d3.hcl(this.getD3Colour(d)).c < 20 ? transparentColour : "none";

                  points.interrupt("point:move")
                      .transition("point:move")
                      .duration(500)
                          .attr("cy", d => y(d._y))
                          .attr("cx", d => x(d._x) + x.bandwidth() / 2)
                          .style("stroke", determineStroke)
                          .style("fill", d => this.getD3Colour(d));

                  points.enter()
                      .append("circle")
                          .attr("class", "point")
                          .style("opacity", 0)
                          .attr("cx", d => x(d._x) + x.bandwidth() / 2)
                          .attr("cy", y(0))
                          .attr("r", 1)
                          .style("fill", d => this.getD3Colour(d))
                          .style("stroke", determineStroke)
                          .style("cursor", "pointer")
                      .merge(points)
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
                              .style("fill", d => d3.hcl(this.getD3Colour(d)).darker())
                              .attr("r", d => sizeScale(d._size) + 5);
                      })
                      .on("mouseout", (d, i, nodes) => {
                          const point = d3.select(nodes[i]);

                          point.interrupt("point:grow")
                              .transition("point:grow")
                              .duration(250)
                              .style("opacity", 0.5)
                              .style("fill", d => this.getD3Colour(d))
                              .attr("r", d => sizeScale(d._size));
                      })
                      .on("click auxclick", d => {
                          this._dispatch.call("elementClick", this, {
                              e: d3.event,
                              point: d
                          })
                      })
                      .transition("point:grow")
                      .duration(800)
                      .delay(isFirstRender ? 0 : 500)
                        .attr("cy", d => y(d._y))
                        .style("opacity", 0.5)
                        .attr("r", d => sizeScale(d._size));

                  points.exit()
                      .interrupt()
                      .transition()
                      .duration(800)
                      .style("opacity", 0)
                      .attr("cy", y(0))
                      .on("end", (d, i, nodes) => d3.select(nodes[i]).remove());


              });
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

    getSizeScale(data) {
        data = data || this.prepareData()
            .map(d => d.data)
            .reduce((acc, val) => acc.concat(val));

        var min = d3.min(data, d => d._size);
        var max = d3.max(data, d => d._size);

        if (min === max) return () => 5;

        return d3.scaleLinear()
            .range([5, 20])
            .domain([Math.min(0, min), Math.max(max, 0)]);
    }
}


export function points() {
    return new Point();
}