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


class Histogram extends Geometry {

    constructor() {
        super();
        this._BAR_GROWTH = 100;
    }

    render() {
        console.log("\tRendering HISTOGRAM");

        const element = this._element;
        const data = this.prepareData(null, true);
        const allData = this.prepareData(null, false);
        const width = this._width,
              height = this._height;

        element.classed("histogram", true);

        console.log("data", data);
        console.log("buckets", this.getBuckets(data));

        const x = d3.scaleBand()
                    .rangeRound([0, width]);

        const y = d3.scaleLinear()
                    .rangeRound([height, 0])
                    .nice();

        const xGroup = d3.scaleBand()
                         .padding(0);

        y.domain([0, d3.max(allData, d => d3.max(d.data, d => d._y))]);
        x.domain(data.map(d => d._key));
        xGroup
              .domain(this.getKeys(data))
              .rangeRound([0, x.bandwidth()]);

        let groups = element.select(".bars").selectAll('.group');

        if (groups.empty()) {
            groups = element
                .append("g")
                .attr("class", "bars")
                .selectAll(".group");
        }

        // Ensure that we're always using the correct height.
        element.select(".bars")
           .attr("transform", "translate(0, " + height + "), scale(1, -1)")

        groups = groups.data(data);

        groups.exit().remove();

        groups.enter()
              .append("g")
                  .attr("class", "group")
                  .attr("transform", d => "translate(" + x(d._key) + ",0)")
                  .attr("width", x.bandwidth())
                  .attr("height", "100%")
              .merge(groups)
              .interrupt("groups:move")
              .transition("groups:move")
                  .attr("transform", d => "translate(" + x(d._key) + ",0)")
                  .attr("width", x.bandwidth())
              .each((s_d, s_i, nodes) => {
                  let group = d3.select(nodes[s_i]);

                  let bars = group.selectAll(".bar")
                                  .data(s_d.data);

                  bars.exit().remove();

                  bars.interrupt("bar:move")     // Animate the bars to their new position.
                      .transition("bar:move")
                      .attr("width", xGroup.bandwidth())
                      .attr("x", d => xGroup(d._key))
                      .attr("y", 0);

                  bars.enter()
                      .append("rect")
                          .attr("class", (d, i) => "bar series series-" + i)
                          .attr("x", d => {console.log("key", d._key); return xGroup(d._key)})
                          .attr("y", 0)
                          .attr("width", xGroup.bandwidth())
                          .attr("height", 0)
                          .style("fill", d => d._colour === 1 ? "grey" : "green")
                          .style("stroke", d => d3.hcl(d._colour).darker())
                          .style("cursor", "pointer")
                      .merge(bars)
                      .interrupt("bar:growth")    // Animate bars growing.
                      .transition("bar:growth")
                      .delay(() => this.calcBarGrowth(s_i, nodes.length))
                          .style("fill", d => d._colour)
                          .attr("height", d => height - y(d._y));

                  //     .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                  //         d3.select(nodes[i])
                  //           .interrupt("hover:colour")
                  //           .transition("hover:colour")
                  //           .duration(400)
                  //           .style("fill", d3.hcl(this.getSeriesColour(i)).darker())
                  //         this._dispatch.call("tooltipShow", this, {
                  //             e: d3.event,
                  //             point: d,
                  //             series: s_d,
                  //             seriesIndex: s_i,
                  //             value: d._y
                  //         })
                  //     })
                  //     .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
                  //         d3.select(nodes[i])
                  //           .interrupt("hover:colour")
                  //           .transition("hover:colour")
                  //           .duration(400)
                  //           .style("fill", this.getSeriesColour(i));
                  //         this._dispatch.call("tooltipHide", this);
                  //     })
                  //     .on("click auxclick", (d, i, nodes) => {
                  //         this._dispatch.call("elementClick", this, {
                  //             e: d3.event,
                  //             point: d,
                  //             series: d._series,
                  //             seriesIndex: s_i,
                  //             value: this._y(d)
                  //         })
                  //     })


              })
    }

    calcBarGrowth(i, max) {
        if (max < 10) return i * this._BAR_GROWTH / 2;
        if (max < 35) return i * this._BAR_GROWTH / 4;
        return 1;
    }

    prepareData(data, faceted) {
        faceted = !!faceted && this.facet();
        data = Geometry.prototype.prepareData.call(this, data);

        let results = {};

        // We want to calculate what bucket each bit of data belongs to.
        Object.keys(data).forEach(key => {
            let values = data[key].data;
            values.forEach(d => {
                if (faceted && !this.facet()(d)) return;
                // todo The bucket is currently just the _x value.
                d._bucket = d._x;
                let bucket = results[d._bucket] || { _key: d._bucket, data: [] };
                bucket.data.push(d);
                results[d._bucket] = bucket;
            })
        });

        return Object.values(results);
    }


    getBuckets(data) {
        if (!data || !data.length) return [];

        // todo calculate buckets
        let buckets = new Set(data.map(d => d._key));


        return [...buckets]
    }

    getKeys(data) {
        if (!data || !data.length) return [];

        let keys = new Set();

        // todo calculate buckets
        Object.keys(data).forEach(key => {
            let values = data[key].data;
            values.forEach(d => keys.add(d._key))
        });


        return [...keys]
    }

}


export function histogram() {
    return new Histogram();
}