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

    constructor(name, padding) {
        super(name || "HISTOGRAM");
        this._BAR_GROWTH = 100;
        this._padding = padding || 0;
    }

    /**
     * Set the padding between bar groups. 0 padding is a standard histogram.
     */
    padding(padding) {
        if (arguments.length === 0) return this._padding;
        this._padding = padding;
        return this;
    }

    render() {
        console.log("\tRendering HISTOGRAM");

        const element = this._element;
        const data = this.prepareData(null, true);
        const allData = this.prepareData(null, false);
        const width = this._width,
              height = this._height;

        element.classed("histogram", true);

        const x = this.getD3XScale(data, width);

        const y = this.getD3YScale(allData, height);

        const xGroup = d3.scaleBand()
                         .padding(0)
                         .domain(this.getKeys(data))
                         .rangeRound([0, x.bandwidth()]);

        const colours = d3.scaleOrdinal(this.colourScale())
                          .domain(this.getColourDomain(allData));

        let groups = element.select(".bars").selectAll('.group');

        if (groups.empty()) {
            console.log("HISTOGRAM: Group is empty");
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

                  bars.exit().each((d) => console.log("HISTOGRAM: remove bar", d)).remove();

                  bars.interrupt("bar:move")     // Animate the bars to their new position.
                      .transition("bar:move")
                      .attr("width", xGroup.bandwidth())
                      .attr("x", d => xGroup(d._key))
                      .attr("y", 0);

                  bars.enter()
                      .append("rect")
                          .attr("class", (d, i) => "bar series series-" + i)
                          .attr("x", d => xGroup(d._key))
                          .attr("y", 0)
                          .attr("width", xGroup.bandwidth())
                          .attr("height", 0)
                          .style("fill", d => colours(d._colour))//d => d._colour === 1 ? "grey" : "green")
                          .style("stroke", d => d3.hcl(colours(d._colour)).darker())
                          .style("cursor", "pointer")
                      .on("click auxclick", (d, i, nodes) => {
                          this._dispatch.call("elementClick", this, {
                              e: d3.event,
                              point: d,
                              series: d._series,
                              seriesIndex: s_i,
                              value: d._y
                          })
                      })
                      .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
                          d3.select(nodes[i])
                            .interrupt("hover:colour")
                            .transition("hover:colour")
                            .duration(400)
                            .style("fill", d3.hcl(colours(d._colour)).darker());
                          this._dispatch.call("tooltipShow", this, {
                              e: d3.event,
                              point: d,
                              series: s_d,
                              seriesIndex: s_i,
                              value: d._y
                          })
                      })
                      .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
                          d3.select(nodes[i])
                            .interrupt("hover:colour")
                            .transition("hover:colour")
                            .duration(400)
                            .style("fill", d => colours(d._colour));
                          this._dispatch.call("tooltipHide", this);
                      })
                      .on("contextmenu", () => d3.event.preventDefault()) // No right click.
                      .merge(bars)
                      .interrupt("bar:growth")    // Animate bars growing.
                      .transition("bar:growth")
                      .delay(() => this.calcBarGrowth(s_i, nodes.length))
                          .style("fill", d => d._colour)
                          .attr("height", d => height - y(d._y));
              })
    }

    calcBarGrowth(i, max) {
        if (max < 10) return i * this._BAR_GROWTH / 2;
        if (max < 35) return i * this._BAR_GROWTH / 4;
        return 1;
    }

    prepareData(data, faceted) {
        data = Geometry.prototype.prepareData.call(this, data, faceted);

        let results = {};

        // We want to calculate what bucket each bit of data belongs to.
        const buckets = this.scaleX()
                            .buckets(Object
                                .values(data)
                                .map(d => d.data)
                                .reduce((acc, cur) => acc.concat(cur))
                                .map(d => d._x));

        // Sort data in to their appropriate buckets. This may be
        // specific date buckets, or general buckets for continuous data.
        Object.keys(data).forEach(key => {
            let values = data[key].data;
            values.forEach(d => {
                d._bucket = buckets.bucket(d._x);
                let bucket = results[d._bucket] || { _key: d._bucket, data: [] };
                bucket.data.push(d);
                results[d._bucket] = bucket;
            })
        });

        return buckets.consolidateBuckets(Object.values(results));
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

    getD3XScale(data, width) {
        data = data || this.prepareData(null, true);
        width = width || this.width();

        return d3.scaleBand()
                 .rangeRound([0, width])
                 .padding((data[0].data.length > 1 ? 0.05 : 0) + this._padding)
                 .domain(data.map(d => d._key));
    }

    getD3YScale(data, height) {
        data = data || this.prepareData(null, false);
        height = height || this.height();

        return d3.scaleLinear()
                 .rangeRound([height, 0])
                 .nice()
                 .domain([0, d3.max(data, d => d3.max(d.data, d => d._y))]);
    }

}


export function histogram() {
    return new Histogram();
}

export function columnChart() {
    return new Histogram("COLUMN_CHART", 0.1);
}