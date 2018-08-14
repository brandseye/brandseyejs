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


class Line extends Geometry {

    render() {
        console.log("\t Rendering LINE");

        const element = this._element;
        const data = this.prepareData();
        const width = this._width,
              height = this._height;

        element.classed("line-chart", true);


        const x = d3.scaleTime()
                    .range([0, width]);

        const y = d3.scaleLinear()
                    .range([height, 0])
                    .nice(5);


        const allData = data.map(d => d.data).reduce((acc, val) => acc.concat(val));
        console.log("All data", allData);
        x.domain(d3.extent(allData, d => d._x));
        y.domain([Math.min(0, d3.min(allData, d => d._y)), d3.max(allData, d => d._y)]);


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
                .attr("class", "lines");

            // This is needed to provide area for mouse interactions.
            lineGroup
                .append("rect")
                .style("opacity", "0")
                .attr("width", "100%")
                .attr("height", "100%");
        }

        lineGroup
            .on("mousemove", (d, i, nodes) => { // Darken the bar on mouse over
                const mouse = d3.mouse(nodes[i]);

                const xval = x.invert(mouse[0]);
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
                    .attr("cx", x(min._x))
                    .attr("cy", y(min._y))
                    .attr("r", 10)
                    .attr("fill", d._colour)
                    .style("opacity", 0.1)
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

        let lines = lineGroup.selectAll('.line');
        lines = lines.data(data);

        lines.exit().remove();

        const line = d3.line()
                       .x(d => {console.log("x", d._x, x(d._x)); return x(d._x)})
                       .y(d => {console.log("y", d._y, y(d._y)); return y(d._y)});

        lines
            .enter()
            .append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", d => "red")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .style("opacity", 0)
            .transition()
                .style("opacity", 1)
                .attr("d", d => line(d.data));

        lines
            .transition()
            .attr("d", d => line(d.data));
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