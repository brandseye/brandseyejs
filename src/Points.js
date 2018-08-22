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


class Point extends Geometry {
    render() {
        console.log("\tRendering POINTS");

        const element = this._element;
        const data = this.prepareData();
        const width = this._width,
              height = this._height;

        element.classed("points", true);


        const x = d3.scaleLinear()
                    .rangeRound([0, width]);

        const y = d3.scaleLinear()
                    .rangeRound([height, 0])
                    .nice();

        const colours = d3.scaleOrdinal(this.colourScale())
                          .domain(this.getColourDomain(data));

        y.domain([Math.min(0, d3.min(data, d => d3.min(d.data, d => d._y))),
            d3.max(data, d => d3.max(d.data, d => d._y))]);
        x.domain([Math.min(0, d3.min(data, d => d3.min(d.data, d => d._x))),
            d3.max(data, d => d3.max(d.data, d => d._x))]);

        let groups = element.selectAll('.point-groups');
        groups = groups.data(data);

        groups.exit().remove();

        groups.enter()
              .append("g")
              .attr("class", "point-groups")
              .merge(groups.selectAll(".point-groups"))
              .each((d, i, nodes) => {
                  const group = d3.select(nodes[i]);
                  const points = group.selectAll(".point")
                      .data(d.data);

                  points.enter()
                      .append("circle")
                      .attr("cx", d => x(d._x))
                      .attr("cy", d => y(d._y))
                      .attr("fill", d => colours(d._colour))
                      .attr("r", 5);
              });
    }
}


export function points() {
    return new Point();
}