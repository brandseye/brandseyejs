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

  // todo colours
  colours(colours) {
    if (!arguments.length) return this._colours;
    this._colours = colours;
    return this;
  }

  //------------------------------------------------------

  // todo backgroundColour
  backgroundColour(colour) {
    if (!arguments.length) return this._backgroundColour;
    this._backgroundColour = colour;
    return this;
  }

  //------------------------------------------------------

  // todo tickFormat
  tickFormat(format) {
    if (!arguments.length) return this._tickFormat;
    this._tickFormat = format;
    return this;
  }

  //------------------------------------------------------

  // todo labelFormat
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

  // todo forceY
  forceY(force) {
    if (!arguments.length) return this._forceY;
    this._forceY = force;
    return this;
  }

  //------------------------------------------------------

// todo missing
  duration(duration) {
    console.log("Duration is:", duration);
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

  // todo dispatch
  dispatch() {
    return this._dispatch;
  }

  //------------------------------------------------------

  render() {
    console.log("b3js -> render");
    if (!this._element) throw new Error("No element set for ColumnChart. See #element()");
    if (!this._data) {
      console.warn("No data set for ColumnChart. See #data()");
      return;
    }

    let data = this._data;
    if (data.length > 1) console.warn("Unable to handle comparisons");
    data = data[0].values;

    var margin = {top: 20, right: 20, bottom: 40, left: 40},
    width = this._width - margin.left - margin.right,
    height = this._height - margin.top - margin.bottom;

    // set the ranges
    let _x = this._x,
        _y = this._y;

    let x = d3.scaleBand()
              .range([0, width])
              .padding(0.02);
    let y = d3.scaleLinear()
              .range([height, 0]);
    this._xscale = x;
    this._yscale = y;

    // Scale the range of the data in the domains
    x.domain(data.map((d) => _x(d)));
    y.domain([0, d3.max(data, (d) => _y(d))]);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    let svg = d3.select(this._element).select("svg");

    if (svg.empty()) {
      svg = d3.select(this._element)
        .append("svg")
          // .attr("width", width + margin.left + margin.right)
          // .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("class", "main-group")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    } else {
      svg = svg
          // .attr("width", width + margin.left + margin.right)
          // .attr("height", height + margin.left + margin.right)
        .select(".main-group")
    }

    //---------------------------------
    // Get rid of current labels.
    svg.select(".labels")
      .remove();

    //---------------------------------
    // append the rectangles for the bar chart
    let bars = svg.select(".bars").selectAll('.bar');

    if (bars.empty()) {
      bars = svg
        .append("g")
          .attr("class", "bars")
          .attr("transform", "translate(0, " + height + "), scale(1, -1)")
        .selectAll(".bar");
    } else {
      svg.select(".bars")
        .attr("transform", "translate(0, " + height + "), scale(1, -1)")
    }
    bars = bars.data(data);

    bars.exit().remove();

    bars   // set x and width for existing bars, animating them.
      .interrupt("bar:move")
      .transition("bar:move")
        .attr("x", (d) => x(_x(d)))
        .attr("y", 0)
        .attr("width", x.bandwidth())

    bars.enter()
      .append("rect")                      // Create the geometry
        .attr("class", "bar")
        .attr("x", (d) => x(_x(d)))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .style("fill", colours.eighteen.midGrey)
        .on("mouseover", (d, i, nodes) => { // Darken the bar on mouse over
          d3.select(nodes[i])
            .interrupt("hover:colour")
            .transition("hover:colour")
            .duration(400)
            .style("fill", d3.hsl(colours.eighteen.midGrey).darker())
        })
        .on("mouseout", (d, i, nodes) => { // bar is regular colour on mouse out.
          d3.select(nodes[i])
            .interrupt("hover:colour")
            .transition("hover:colour")
            .duration(400)
            .style("fill", colours.eighteen.midGrey);
        })
      .merge(bars)                // For both enter and update selections.
      .interrupt("bar:growth")
      .transition("bar:growth")   // Animate the bars to their new position.
        .delay((d,i) => i * this._BAR_GROWTH )
        .duration(this._duration)
        .attr("height", (d) => height - y(_y(d)))


    // Labels loaded after our first bar grows.
    if (this._show_labels) {
      svg.transition("bar:growth")
        .on("end", (d, i, nodes) => {
          if (i < nodes.length - 1) return;
          this.renderLabels(svg, data, x, y, _x, _y);
        })
    }

    //---------------------------------
    // add the Y gridlines
    svg.call(this.grid, width, d3.axisLeft(y).ticks(5));

    //---------------------------------
    // axes
    svg.call(this.xaxis, height, x);
    svg.call(this.yaxis, d3.axisLeft(y).ticks(5));

    svg.selectAll("text")
      .style("fill", colours.eighteen.darkGrey);

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
            let labels = selection.select('.labels');
            if (!labels.empty()) return;
            labels.remove()
            this.renderLabels(selection, data, xscale, yscale, xgetter, ygetter, false);
          }
        }

      },

      hide: () => {
        if (this._element) {
          d3.select(this._element)
            .select('.labels')
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
      .attr("class", "labels")
      .selectAll(".label")
      .data(data)

    let maxWidth = 0;     // For calculating the max width of text.
    let fontSize = 12;    // Our initial font size.
    const buffer = 5;     // Buffer space between words and the top of a bar.
    const calcDy = (ypos) => ypos < 10 ? fontSize + buffer : - buffer;

    labels.enter().each((d, i, nodes) => {
      let ypos = yscale(ygetter(d));
      let dy = calcDy(ypos);
      let text = d3.select(nodes[i])
        .append("text")
          .text(ygetter(d))
          .attr("class", "label")
          .attr("y", ypos )
          .attr("dx", animate ? -15 : 0)
          .attr("dy", dy)
          .style("opacity", 0)
          .style("font-size", fontSize)
          .style("font-family", "Open Sans, sans-serif")
          .style("font-weight", "normal")
          .style("fill", colours.eighteen.darkGrey);

      // Set the x position, which is based on width.
      const width = text.node().getBBox().width;
      maxWidth = Math.max(width, maxWidth);
      text
        .attr("x", xscale(xgetter(d)) + xscale.bandwidth() / 2 - width / 2);

      text
        .transition("labels")
          .delay(() => animate ? i * this._BAR_GROWTH : 0) // Delay in lockstep with bar growth.
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
          .selectAll("text")
          .style("font-size", fontSize)
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
    grid.selectAll(".domain").remove()

    grid
      .lower() // Always ensure that this is earlier in the dom. Things must be drawn on top of it.
      .style("opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1);
  }

  //------------------------------------------------------

  xaxis(selection, height, xscale) {
    const width = xscale.bandwidth();

    selection.select(".x-axis").remove();
    let axis = selection.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .style("opacity", 0)
        .call(d3.axisBottom(xscale).tickSize(0).tickPadding(5))

    axis.select(".domain").remove();

    let max = 0;
    axis.selectAll("text")
      .style("font-family", "Open Sans, sans-serif")
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
    selection.append("g")
        .attr("class", "y-axis")
        .call(axis.tickSize(0).tickPadding(10))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
  }
}
