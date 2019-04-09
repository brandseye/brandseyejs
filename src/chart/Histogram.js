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

import { Geometry, fromKey } from './Geometry';
import { colours } from "../Colours";
import { toColourKey } from "../Legend";
import { labelIsZero } from "../helpers";


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
        const element = this._element;
        const data = this.prepareData(null, true);
        const allData = this.prepareData(null, false);
        const width = this._width,
              height = this._height;

        element.classed("histogram", true);

        const x = this.getD3XScale(data, width);
        const y = this.getD3YScale(allData, height);
        const xGroup = this.getD3XGroupScale(data, x);
        const colours = this.d3ColourScale();

        let groups = element.select(".bars").selectAll('.group');

        //----------------------------------------------
        // Get rid of current labels

        element.select(".chart-labels")
           .remove();

        //----------------------------------------------

        if (groups.empty()) {
            groups = element
                .append("g")
                .attr("class", "bars")
                .selectAll(".group");
        }

        // Ensure that we're always using the correct height.
        element.select(".bars")
           .attr("transform", "translate(0, " + height + "), scale(1, -1)");

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
                          .attr("x", d => xGroup(d._key))
                          // .attr("y", d => height - y(Math.min(0, d._y)))
                      .attr("y", height - y(0))
                          .attr("width", xGroup.bandwidth())
                          .attr("height", 0)
                          .style("cursor", "pointer")
                          .style("fill", d => this.getD3Colour(d)) // colours(d._colour))
                          .style("stroke", d => d3.hcl(this.getD3Colour(d)).darker())
                      .on("contextmenu", () => d3.event.preventDefault()) // No right click.
                      .merge(bars)
                        .attr("class", d => "bar series series-" + toColourKey(d._colour))
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
                            .style("fill", d3.hcl(this.getD3Colour(d)).darker());
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
                            .style("fill", d => this.getD3Colour(d));
                          this._dispatch.call("tooltipHide", this);
                      })
                      .interrupt("bar:growth")    // Animate bars growing.
                      .transition("bar:growth")
                      .delay(() => this.calcBarGrowth(s_i, nodes.length))
                          .style("fill", d => this.getD3Colour(d)) //colours(d._colour))
                          .style("stroke", d => d3.hcl(this.getD3Colour(d)).darker())
                          .attr("y", d => height - y(Math.min(0, d._y)))
                          .attr("height", d => (Math.abs(y(0) - y(d._y))));
              });

        // Labels loaded after our last bar grows.
        if (this.showLabels()) {
            element.transition("bar:growth")
               .on("end", (d, i, nodes) => {
                   if (i < nodes.length - 1) return;
                   this.renderLabels(element, data, x, xGroup, y, colours);
               })
        }
    }

    calcBarGrowth(i, max) {
        if (max < 10) return i * this._BAR_GROWTH / 2;
        if (max < 35) return i * this._BAR_GROWTH / 4;
        return 1;
    }

    prepareData(data, faceted) {
        data = Geometry.prototype.prepareData.call(this, data, faceted);

        const sortOrder = {};
        this.xValues().forEach((d, i) => {
            sortOrder[d] = sortOrder[d] || ("" + i);
        });

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

        return buckets.consolidateBuckets(Object.values(results))
            .sort((lhs, rhs) => {
                return sortOrder["" + lhs._key] - sortOrder["" + rhs._key];
            });
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
                 .padding((data[0].data.length > 1 ? 0.2 : 0) + this._padding)
                 .domain(data.map(d => d._key));
    }

    getD3YScale(data, height) {
        data = data || this.prepareData(null, false);
        height = height || this.height();


        const max = Math.max(d3.max(data, d => d3.max(d.data, d => d._y)), 0);
        const min = Math.min(0, d3.min(data, d => d3.min(d.data, d => d._y)));
        return d3.scaleLinear()
                 .rangeRound([height, 0])
                 .nice()
                 .domain([min, max]);
    }

    getD3XGroupScale(data, xscale) {
        return d3.scaleBand()
                 .padding(0)
                 .domain(this.getKeys(data))
                 .rangeRound([0, xscale.bandwidth()]);
    }

    renderLabels(selection, data, xscale, xgroup, yscale, colourScale, animate) {
        animate = animate === undefined ? true : animate;
        selection.selectAll(".chart-labels").remove();

        let labels = selection.append("g")
                              .attr("class", "chart-labels")
                              .selectAll(".label-group")
                              .data(data);

        let maxWidth = 0;     // For calculating the max width of text.
        let fontSize = 12;    // Our initial font size.
        const buffer = 5;     // Buffer space between words and the top of a bar.
        const calcDy = (y, ypos) => ((y >= 0 && ypos < 10) || ( y < 0 && this._height - ypos > 10)) ? fontSize + 2: -buffer;

        // Want to figure out if the label is too dark / light for the
        // bar.
        const getInvertedColor = d => {
            let invertedColor = d3.hcl(this.getD3Colour(d));
            invertedColor.l += Math.min(invertedColor.l + 50, 100);
            return invertedColor;
        };
        const shouldInvert = d => d3.hcl(this.getD3Colour(d)).l < 60;
        const fillColour = d3.hcl(colours.eighteen.darkGrey).brighter();
        const lighterFillColour = d3.hcl(colours.eighteen.midGrey);
        const findColour = (d, dy, labelText) => {
            const onBar = (d._y >= 0 && dy > 0 || d._y < 0 && dy < 0);
            return onBar && shouldInvert(d)
                ? getInvertedColor(d).toString()
                : (labelIsZero(labelText)
                    ? lighterFillColour
                    : (onBar ? d3.hcl(fillColour).darker() : fillColour));
        };

        labels.enter().each((series, s_i, s_nodes) => {
            // We want to determine which groups may have missing values, and provide them.
            const requiredGroups = {};
            xgroup.domain().map(fromKey).forEach(d => {
                requiredGroups[d._colour] = d;
            });

            series.data.forEach(d => {
                delete requiredGroups[d._colour]
            });

            const missingGroups = Object.values(requiredGroups);
            missingGroups.forEach(d => {
                d._x = series._key;
                d._y = 0;
            });

            d3.select(s_nodes[s_i])
              .append("g")
              .attr("class", "label-group")
              .attr("transform", d => "translate(" + xscale(d._key) + ",0)")
              .selectAll(".chart-label")
              .data(series.data.concat(Object.values(missingGroups)))
              .enter()
              .each((d, i, nodes) => {
                  const labelText = this.formatLabel()(d._y, d);
                  let ypos = yscale(d._y);
                  let dy = calcDy(d._y, ypos);
                  let text = d3.select(nodes[i])
                               .append("text")
                               .text(labelText)
                               .attr("class", d => "chart-label series series-" + toColourKey(d._colour))
                               .attr("y", ypos)
                               .attr("dx", animate ? -15 : 0)
                               .attr("dy", dy)
                               .style("opacity", 0)
                               .style("pointer-events", "none")
                               .style("fill", d => findColour(d, dy, labelText));

                  // Set the x position, which is based on width.
                  const width = text.node().getBBox().width;
                  maxWidth = Math.max(width, maxWidth);
                  text
                      .attr("x", xgroup(d._key) + xgroup.bandwidth() / 2 - width / 2);

                  text
                      .transition("labels")
                      .delay(() => animate ? this.calcBarGrowth(s_i, s_nodes.length) : 0) // Delay in lockstep with bar growth.
                      .attr("dx", 0)
                      .style("opacity", 1)
              })
        });


        // Figure out if we don't have enough space to show our labels.
        // We then want to resize, if possible.
        if (xgroup.bandwidth() < maxWidth * 1.10) {
            let scale = maxWidth / xgroup.bandwidth() * 1.10;
            fontSize = Math.floor(fontSize / scale);

            if (fontSize < 8) {
                // The labels are too small.
                labels.enter().selectAll("text").remove();
            } else {
                labels.enter()
                      .merge(labels)
                      .selectAll("text")
                      .style("font-size", fontSize + "px")
                      .each((d, i, nodes) => {
                          const text = d3.select(nodes[i]);
                          const width = text.node().getBBox().width;
                          const dy = calcDy(d._y, yscale(d._y));

                          text
                              .attr("x", xgroup(d._key) + xgroup.bandwidth() / 2 - width / 2)
                              .style("fill", d => findColour(d, dy, text.text()))
                              .attr("dy", dy);
                      })
            }
        }
    }


    immediatelyRenderLabels(show) {
        const element = this.element();
        if (!element) return;

        if (!show) { // Hides the labels
            element
              .select('.chart-labels')
              .interrupt("labels")
              .interrupt("labels:fade")
              .transition("labels:fade")
              .style("opacity", 0)
              .on("end", (d, i, nodes) => {
                  d3.select(nodes[i]).remove();
              })
        } else {
            let labels = element.select('.chart-labels');
            if (!labels.empty()) return;

            const data = this.prepareData(null, true);
            const allData = this.prepareData(null, false);

            const xscale = this.getD3XScale(data),
                  xgroup = this.getD3XGroupScale(data, xscale),
                  yscale = this.getD3YScale(data),
                  colourScale = this.d3ColourScale();

            labels.remove();
            this.renderLabels(element, data, xscale, xgroup, yscale, colourScale, false);
        }

    }


}


export function histogram() {
    return new Histogram();
}

export function columnChart() {
    return new Histogram("COLUMN_CHART", 0.1);
}