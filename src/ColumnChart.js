import { colours } from './Colours';
import * as d3 from 'd3';


export class ColumnChart {
  constructor() {
    this._x = (d) => d.x;
    this._y = (d) => d.y;
    this._height = 420;
    this._width = 420;
    this._BAR_GROWTH = 100;
    this._duration = 300;
    this._dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick',
                                 'tooltipShow', 'tooltipHide');
    this._xAxisTickFormat = this._tickFormat = this._labelFormat = d => d.toString();
    this._colours = [ colours.eighteen.midGrey ]
    this._backgroundColour = "#FFF"
  }

  //------------------------------------------------------

  data(data) {
    if (!arguments.length) return this._data;
    if (data && data[0].key === undefined) {
            data = [
                {
                    key: "series 1",
                    values: data
                }
            ];
        }
    this._data = data;
    return this;
  }

  //------------------------------------------------------

  element(element) {
    if (!arguments.length) return this._element;
    this._element = element;
    return this;
  }

  //------------------------------------------------------

  showLabels(show) {
    if (!arguments.length) return this._show_labels;
    this._show_labels = show;
    return this;
  }

  //------------------------------------------------------

  // todo dispatch
  showLegend(show) {
    if (!arguments.length) return this._show_legend;
    this._show_legend = show;
    return this;
  }

  //------------------------------------------------------

  x(x) {
    if (!arguments.length) return this._x;
    this._x = x;
    return this;
  }

  //------------------------------------------------------

  y(y) {
    if (!arguments.length) return this._y;
    this._y = y;
    return this;
  }

  //------------------------------------------------------

  width(width) {
    if (!arguments.length) return this._width;
    this._width = width;
    return this;
  }

  //------------------------------------------------------

  height(height) {
    if (!arguments.length) return this._height;
    this._height = height;
    return this;
  }

  //------------------------------------------------------

  colours(colours) {
    if (!arguments.length) return this._colours;
    this._colours = colours;
    return this;
  }

  //------------------------------------------------------

  backgroundColour(colour) {
    if (!arguments.length) return this._backgroundColour;
    this._backgroundColour = colour || "#FFF"; // never set it to null.
    return this;
  }

  //------------------------------------------------------

  tickFormat(format) {
    if (!arguments.length) return this._tickFormat;
    this._tickFormat = format;
    return this;
  }

  //------------------------------------------------------

  xAxisTickFormat(format) {
    if (!arguments.length) return this._xAxisTickFormat;
    this._xAxisTickFormat = format;
    return this;
  }

  //------------------------------------------------------

  labelFormat(format) {
    if (!arguments.length) return this._labelFormat;
    this._labelFormat = format;
    return this;
  }

  //------------------------------------------------------

  // todo missing
  labelCompression(compression) {
    if (!arguments.length) return this._compression;
    this._compression = compression;
    return this;
  }

  //------------------------------------------------------

  //todo missing
  dataAxisLabel(label) {
    if (!arguments.length) return this._dataAxisLabel;
    this._dataAxisLabel = label;
    return this;
  }

  //------------------------------------------------------

  tooltip(tooltip) {
    if (!arguments.length) return this._tooltip;
    this._tooltip = tooltip;
    return this;
  }

  //------------------------------------------------------

  forceY(force) {
    if (!arguments.length) return this._forceY;
    this._forceY = force;
    return this;
  }

  //------------------------------------------------------

// todo missing
  duration(duration) {
    if (!arguments.length) return this._duration;
    this._duration = duration;
    return this;
  }

// todo missing
  coarseness(coarseness) {
    if (!arguments.length) return this._coarseness;
    this._coarseness = coarseness;
    return this;
  }

  // todo missing
  padding(padding) {
    if (!arguments.length) return this._padding;
    this._padding = padding;
    return this;
  }

  // todo missing
  xAxisTooltips(tooltips) {
    if (!arguments.length) return this._xAxisTooltips;
    this._xAxisTooltips = tooltips;
    return this;
  }

  // todo missing
  xAxisOverride(override) {
    if (!arguments.length) return this._xAxisOverride;
    this._xAxisOverride = override;
    return this;
  }

  //------------------------------------------------------

  dispatch() {
    return this._dispatch;
  }

  //------------------------------------------------------

  render() {
    if (!this._element) throw new Error("No element set for ColumnChart. See #element()");
    if (!this._data) {
      console.warn("No data set for ColumnChart. See #data()");
      return;
    }

    let data = this.getTransformedData();
    let keys = this.getKeys();
    console.log("Keys are", keys);

    let margin = {top: 20, right: 20, bottom: 40, left: 40};
    if (this._dataAxisLabel) margin.left += 20 + 12;
    if (data) {
      let maxLabelLength = 0;
      data.forEach(d => {
        d.data.forEach(d => {
          let length = this._xAxisTickFormat(this._x(d)).length;
          if (length > maxLabelLength) maxLabelLength = length;
        })
      })
      margin.bottom += maxLabelLength * 1.5;
    }

    let width = this._width - margin.left - margin.right,
        height = this._height - margin.top - margin.bottom;

    // set the ranges
    let _x = this._x,
        _y = this._y;

    let x = d3.scaleBand()
              .range([0, width])
              .padding(0.02);

    let xGroup = d3.scaleBand()
              .padding(0)

    let y = d3.scaleLinear()
              .range([height, 0]);
    this._xscale = x;
    this._yscale = y;

    // Scale the range of the data in the domains
    x.domain(data.map(d => d.key));
    xGroup = xGroup.rangeRound([0, x.bandwidth()]).domain(keys);
    y.domain([0, d3.max(data, d => d3.max(d.data, d => d._y))]);
    console.log("Max is: ", d3.max(data, d => d3.max(d.data, d => d._y)));
    console.log("series 1 value is", keys.map(d => xGroup(d)));

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    let topLevel = d3.select(this._element).select("svg");

    if (topLevel.empty()) {
      topLevel = d3.select(this._element)
        .append("svg")
          .attr("width", "100%")
          .attr("height", "100%");
    }

    let svg = topLevel.select('.main-group');

    if (svg.empty()) {
      svg = topLevel
        .append("g")
          .attr("class", "main-group")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }

    //---------------------------------
    // Get rid of current labels.
    svg.select(".chart-labels")
      .remove();

    //---------------------------------
    // append the rectangles for the bar chart
    let groups = svg.select(".bars").selectAll('.group');
    console.log("groups is", groups.nodes());

    if (groups.empty()) {
      groups = svg
        .append("g")
          .attr("class", "bars")
        .selectAll(".group");
    }

    svg.select(".bars")
      .attr("transform", "translate(0, " + height + "), scale(1, -1)")

    groups = groups.data(data);
    console.log("Data", data);

    groups.exit().remove();

    // Adding new groups, and hence adding new bars to those groups.
    groups.enter()
      .append("g")
        .attr("class", "group")
        .attr("transform", d => "translate(" + x(_x(d.data[0])) + ",0)")
        .attr("width", x.bandwidth())
        .attr("height", "100%")
      .merge(groups)
      .interrupt("groups:move")
      .transition("groups:move")
        .attr("transform", d => "translate(" + x(_x(d.data[0])) + ",0)")
        .attr("width", x.bandwidth())
      .each((s_d, s_i, nodes) => {
        let group = d3.select(nodes[s_i])

        let bars = group.selectAll(".bar")
          .data(s_d.data);

        bars.interrupt("bar:move")     // Animate the bars to their new position.
          .transition("bar:move")
            .attr("width", xGroup.bandwidth())
            .attr("x", d => xGroup(d._key))
            .attr("y", 0);

        bars.enter()
          .append("rect")
            .attr("class", "bar")
            .attr("x", d => xGroup(d._key))
            .attr("y", 0)
            .attr("width", xGroup.bandwidth())
            .attr("height", 0)
            .style("fill", (d, i) => this.getSeriesColour(i))
            .style("cursor", "pointer")
          .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
            d3.select(nodes[i])
              .interrupt("hover:colour")
              .transition("hover:colour")
              .duration(400)
              .style("fill", d3.hcl(this.getSeriesColour(i)).darker())
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
              .style("fill", this.getSeriesColour(i));
            this._dispatch.call("tooltipHide", this);
          })
          .on("click auxclick", (d, i, nodes) => {
            this._dispatch.call("elementClick", this, {
              e: d3.event,
              point: d,
              series: d._series,
              seriesIndex: s_i,
              value: this._y(d)
            })
          })
          .merge(bars)
          .interrupt("bar:growth")    // Animate bars growing.
          .transition("bar:growth")
            .delay((d) => {
              return this.calcBarGrowth(s_i, nodes.length);
            })
            .duration(this._duration)
            .style("fill", (d, i) => this.getSeriesColour(i))
            .attr("height", d => height - y(d._y));

      })






    // bars.enter()
    //   .append("rect")                      // Create the geometry
    //     .attr("class", "bar")
    //     .attr("x", (d) => x(_x(d)))
    //     .attr("y", 0)
    //     .attr("width", x.bandwidth())
    //     .attr("height", 0)
    //     .style("fill", this.getSeriesColour(0))
    //     .style("cursor", "pointer")
    //   .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
    //     d3.select(nodes[i])
    //       .interrupt("hover:colour")
    //       .transition("hover:colour")
    //       .duration(400)
    //       .style("fill", d3.hcl(this.getSeriesColour(0)).darker())
    //     this._dispatch.call("tooltipShow", this, {
    //       e: d3.event,
    //       point: d,
    //       series: this._data[0], // todo comparisons
    //       seriesIndex: 0,
    //       value: this._y(d)
    //     })
    //   })
    //   .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
    //     d3.select(nodes[i])
    //       .interrupt("hover:colour")
    //       .transition("hover:colour")
    //       .duration(400)
    //       .style("fill", this.getSeriesColour(0));
    //     this._dispatch.call("tooltipHide", this);
    //   })
    //   .on("click auxclick", (d, i, nodes) => {
    //     this._dispatch.call("elementClick", this, {
    //       e: d3.event,
    //       point: d,
    //       series: this._data[0], // todo comparisons
    //       seriesIndex: 0,
    //       value: this._y(d)
    //     })
    //   })
    //   .merge(bars)                // For both enter and update selections.
    //   .interrupt("bar:growth")
    //   .transition("bar:growth")   // Animate the bars to their new position.
    //     .delay((d, i, nodes) => {
    //       return this.calcBarGrowth(i, nodes.length);
    //     })
    //     .duration(this._duration)
    //     .style("fill", this.getSeriesColour(0))
    //     .attr("height", (d) => height - y(_y(d)));


    // Labels loaded after our first bar grows.
    if (this._show_labels) {
      svg.transition("bar:growth")
        .on("end", (d, i, nodes) => {
          if (i < nodes.length - 1) return;
          alert("SHOW")
          // this.renderLabels(svg, data, x, y, _x, _y);
        })
    }

    if (this._dataAxisLabel) {
      this.renderDataAxisLabel(height, margin);
    }

    // ---------------------------------
    // Set the background colour

    d3.select(this._element).select(".background").remove();
    if (this._backgroundColour) {
      d3.select(this._element).select("svg")
        .append("rect")
          .attr("class", "background")
          .attr("width", "100%")
          .attr("height", "100%")
          .style("fill", this._backgroundColour)
        .lower();
    }

    //---------------------------------
    // add the Y gridlines
    svg.call(this.grid, width, d3.axisLeft(y).ticks(5));

    //---------------------------------
    // axes
    svg.call(this.xaxis, height, x.bandwidth(), d3.axisBottom(x).tickSize(0).tickPadding(5).tickFormat(this._xAxisTickFormat));
    svg.call(this.yaxis, d3.axisLeft(y).ticks(5).tickFormat(this._tickFormat));
  }

  //------------------------------------------------------

  /*
   * Returns an object with two functions, #show() and #hide(),
   * to show and hide the labels.
   */
  labels() {
    return {

      show: () => {
        if (this._element) {
          let selection = this._element,
              data = this._data,
              xscale = this._xscale,
              yscale = this._yscale,
              xgetter = this._x,
              ygetter = this._y;

          if (selection) selection = d3.select(this._element).select("svg").select("g");
          if (data) data = data[0].values;
          if (!selection.empty() && data && xscale && yscale && xgetter && ygetter) {
            let labels = selection.select('.chart-labels');
            if (!labels.empty()) return;
            labels.remove()
            this.renderLabels(selection, data, xscale, yscale, xgetter, ygetter, false);
          }
        }

      },

      hide: () => {
        if (this._element) {
          d3.select(this._element)
            .select('.chart-labels')
            .interrupt("labels")
            .interrupt("labels:fade")
            .transition("labels:fade")
            .style("opacity", 0)
            .on("end", (d, i, nodes) => {
              d3.select(nodes[i]).remove();
            })
        }
      }
    }
  }

  //------------------------------------------------------

  renderLabels(selection, data, xscale, yscale, xgetter, ygetter, animate) {
    animate = animate === undefined ? true : animate;

    let labels = selection.append("g")
      .attr("class", "chart-labels")
      .selectAll(".chart-label")
      .data(data)

    let maxWidth = 0;     // For calculating the max width of text.
    let fontSize = 12;    // Our initial font size.
    const buffer = 5;     // Buffer space between words and the top of a bar.
    const calcDy = (ypos) => ypos < 10 ? fontSize + buffer : - buffer;

    // Want to figure out if the label is too dark / light for the
    // bar.
    let invertedColor = d3.hcl(this.getSeriesColour(0));
    invertedColor.l += Math.min(invertedColor.l + 50, 100);
    let invert = d3.hcl(this.getSeriesColour(0)).l < 60;

    labels.enter().each((d, i, nodes) => {
      let ypos = yscale(ygetter(d));
      let dy = calcDy(ypos);
      let text = d3.select(nodes[i])
        .append("text")
          .text(this._labelFormat(ygetter(d)))
          .attr("class", "chart-label")
          .attr("y", ypos)
          .attr("dx", animate ? -15 : 0)
          .attr("dy", dy)
          .style("opacity", 0)
          .style("pointer-events", "none")
          .style("font-family", "Open Sans, sans-serif")
          .style("font-weight", "normal")
          .style("font-size", fontSize + "px")
          .style("fill", dy > 0 && invert ? invertedColor.toString() : colours.eighteen.darkGrey);

      // Set the x position, which is based on width.
      const width = text.node().getBBox().width;
      maxWidth = Math.max(width, maxWidth);
      text
        .attr("x", xscale(xgetter(d)) + xscale.bandwidth() / 2 - width / 2);

      text
        .transition("labels")
          .delay(() => animate ? this.calcBarGrowth(i, nodes.length) : 0) // Delay in lockstep with bar growth.
          .duration(this._duration)
          .attr("dx", 0)
          .style("opacity", 1)
    })

    // Figure out if we don't have enough space to show our labels.
    // We then want to resize, if possible.
    if (xscale.bandwidth() < maxWidth) {
      let scale = maxWidth / xscale.bandwidth() * 1.05;
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
            text
              .attr("x", xscale(xgetter(d)) + xscale.bandwidth() / 2 - width / 2)
              .attr("dy", calcDy(ygetter(d)));
          })
      }
    }
  }

  //------------------------------------------------------

  renderDataAxisLabel(height, margins) {
    let svg = d3.select(this._element).select('svg');
    svg.selectAll(".data-labels").remove();

    if (!this._dataAxisLabel) return;
    let text = this._dataAxisLabel;
    if (text.long) text = text.long;

    let x = - (margins.top + height / 2);

    let label = svg.append("g")
        .attr("class", "data-labels")
      .append("text")
        .text(text)
        .attr("transform", "rotate(-90 0,0) translate(" + x + ", 20)")
        .style("font-family", "Open Sans, sans-serif")
        .style("font-size", "12px")
        .style("font-style", "italic")
        .style("fill", colours.eighteen.darkGrey);

    let width = label.node().getBBox().width;
    if (width >= height && this._dataAxisLabel.short) {
      label.text(this._dataAxisLabel.short);
      width = label.node().getBBox().width;
    }

    label.attr("dx", - width / 2);
  }

  //------------------------------------------------------

  grid(selection, width, axis) {
    selection.select(".grid").remove();

    let grid = selection.append("g")
        .attr("class", "grid")
        .call(axis
            .tickSize(-width)
            .tickFormat("")
        );

    grid.selectAll("line")
      .style("stroke", colours.eighteen.lightGrey);
    grid.selectAll(".domain").remove();

    grid
      .lower() // Always ensure that this is earlier in the dom. Things must be drawn on top of it.
      .style("opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1);
  }

  //------------------------------------------------------

  xaxis(selection, height, width, xaxis) {
    selection.select(".x-axis").remove();
    let axis = selection.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .style("opacity", 0)
        .call(xaxis);

    axis.select(".domain").remove();

    let max = 0;
    axis.selectAll("text")
      .style("font-family", "Open Sans, sans-serif")
      .style("fill", colours.eighteen.darkGrey)
      .nodes()
      .forEach(text => max = Math.max(max, text.getBBox().width));

    if (max >= width - 10) {
      axis.selectAll("text")
        .style('text-anchor', 'end')
        .attr("transform", "rotate(-30 0,0)")
    }

    axis
      .transition()
      .duration(1000)
        .style("opacity", 1);
  }

  //------------------------------------------------------

  yaxis(selection, axis) {
    selection.select(".y-axis").remove();
    let x = selection.append("g")
        .attr("class", "y-axis")
        .call(axis.tickSize(0).tickPadding(10))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    x.selectAll("text")
      .style("font-family", "Open Sans, sans-serif")
      .style("fill", colours.eighteen.darkGrey)
  }

  //------------------------------------------------------

  calcBarGrowth(i, max) {
    if (max < 10) return i * this._BAR_GROWTH / 2;
    if (max < 35) return i * this._BAR_GROWTH / 4;
    return 1;
  }

  getSeriesColour(i) {
    if (i < 0 || !this._colours) return colours.eighteen.midGrey;

    i = i % this._colours.length;
    return this._colours[i];
  }

  getTransformedData() {
    console.log("Raw data is:", this._data);
    let data = this._data;
    if (!data || !data.length) return [];

    let results = [];

    data.forEach((series, s_i) => {
      series.values.forEach((d, d_i) => {
        if (results.length <= d_i) {
          results.push({
            data: [],
            key: this._x(d)
          })
        }

        let field = results[d_i];
        field.data.push(Object.assign({
          _series: series,
          _s_i: s_i,
          _key: series.key,
          _y: this._y(d)
        }, d));
      })
    })

    return results;
  }

  getKeys() {
    let data = this._data;
    if (!data || !data.length) return [];

    return [...new Set(data.map(d => d.key))]
  }
}
