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
        const totalElements = data.map(d => d.data.length).reduce( (acc, val) => acc + val);

        element.classed("points", true);
        element.style("opacity", this._opacity === null ? 1.0 : this._opacity)

        const x = this.getD3XScale(allData, width);
        const y = this.getD3YScale(allData, height);
        const sizeScale = this.getSizeScale(allData);

        let groups = element.selectAll('.point-groups');
        groups = groups.data(data, d => d._key);

        groups.exit().remove();

        let geometryIndex = this._index
        const colourFn = d => {
            let colourFn = d._colourFn
            if (colourFn) {
                let c = colourFn(d, geometryIndex)
                if (c) return c
            }
            return this.getD3Colour(d)
        }

        const transparentColour = d3.hcl(colours.eighteen.darkGrey);
        transparentColour.opacity = 0.8;
        const determineStroke = d => d3.hcl(colourFn(d)).c < 20 ? transparentColour : "none";

        // Try to choose opacity of the points based on how much data there is,
        // and how much space we have to display them. When they are overlapping (this is
        // a heuristic to determine that), greater opacity helps to see clustering and distribution.
        const diagonal = Math.sqrt(this.width() * this.width() + this.height() * this.height());
        const defaultOpacity = Math.max(Math.min(0.9, diagonal / totalElements / 15), 0.5);

        groups.enter()
              .append("g")
              .attr("class", d => "point-groups series series-" + toColourKey(d.data[0]._colour))
              .merge(groups)
              .each((d, i, nodes) => {
                  const group = d3.select(nodes[i]);
                  let points = group.selectAll(".point")
                      .data(d.data, d => d._x);

                  const isFirstRender = !group.property("renderedOnce");
                  group.property("renderedOnce", true);

                  points.exit().remove();

                  points.attr("cy", d => y(d._y))
                          .attr("cx", d => x(d._x) + x.bandwidth() / 2)
                          .attr("r", d => sizeScale(Math.abs(d._size)))
                          .style("stroke", determineStroke)
                          .style("fill", colourFn);

                  points = points.enter()
                      .append("circle")
                          .attr("class", "point")
                          .style("opacity", 0)
                          .attr("cx", d => x(d._x) + x.bandwidth() / 2)
                          .attr("cy", y(0))
                          .attr("r", 1)
                          .style("fill", colourFn)
                          .style("stroke", determineStroke)
                          .style("cursor", "pointer")
                      .merge(points)

                  points.on("mouseover", (d, i, nodes) => {
                          this._dispatch.call("tooltipShow", this, {
                              e: d3.event,
                              point: d
                          });

                          const point = d3.select(nodes[i]);

                          point.interrupt("point:grow")
                              .transition("point:grow")
                              .duration(250)
                              .style("opacity", 1)
                              .style("fill", d => d3.hcl(colourFn(d)).darker())
                              .attr("r", d => sizeScale(Math.abs(d._size)) + 5);
                      })
                      .on("mouseout", (d, i, nodes) => {
                          const point = d3.select(nodes[i]);

                          point.interrupt("point:grow")
                              .transition("point:grow")
                              .duration(250)
                              .style("opacity", defaultOpacity)
                              .style("fill", colourFn)
                              .attr("r", d => sizeScale(Math.abs(d._size)));
                      })
                      .on("click auxclick contextmenu", d => {
                          if (d3.event.type === "contextmenu") d3.event.preventDefault()
                          this._dispatch.call("elementClick", this, {
                              e: d3.event,
                              point: d
                          })
                      })

                  points = this._no_animation ? points : points.transition().duration(800).delay(isFirstRender ? 0 : 500)

                  points.attr("cy", d => y(d._y))
                        .style("opacity", defaultOpacity)
                        .attr("r", d => sizeScale(Math.abs(d._size)));

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
        data = data || this.prepareData().map(d => d.data).reduce((acc, val) => acc.concat(val))
        height = height || this.height();

        let max = Math.max(d3.max(data, d => d._y), this._axis_max_value || 0)
        let min = Math.min(this._axis_min_value || 0, d3.min(data, d => d._y))
        return d3.scaleLinear().range([height, 0]).nice(5).domain([min, max])
    }

    getSizeScale(data) {
        data = data || this.prepareData()
            .map(d => d.data)
            .reduce((acc, val) => acc.concat(val));

        const min = d3.min(data, d => Math.abs(d._size));
        const max = d3.max(data, d => Math.abs(d._size));

        if (min === max) return () => 5;

        let rangeMin = 5;
        let rangeMax = 20;
        const size = Math.min(this.width(), this.height());
        if (size < 200) {
            rangeMax = Math.max(8, size * 0.05);
            rangeMin = Math.max(2, size * 0.025);
        }

        return d3.scaleLinear()
            .range([rangeMin, rangeMax])
            .domain([Math.min(0, min), Math.max(max, 0)]);
    }
}


export function points() {
    return new Point();
}