import { colours } from './Colours';


export class ColumnChart {
  constructor() {
    this._x = (d) => d.x;
    this._y = (d) => d.y;
    this._height = 420;
    this._width = 420;
  }

  data(data) {
    if (data === undefined) return this._data;
    this._data = data;
    return this;
  }

  element(element) {
    if (element === undefined) return this._element;
    this._element = element;
    return this;
  }

  x(x) {
    if (x === undefined) return this._x;
    this._x = x;
    return this;
  }

  y(y) {
    if (y === undefined) return this._y;
    this._y = y;
    return this;
  }

  width(width) {
    if (width === undefined) return this._width;
    this._width = width;
    return this;
  }

  height(height) {
    if (height === undefined) return this._height;
    this._height = height;
    return this;
  }

  render() {
    if (!this._element) throw new Error("No element set for ColumnChart. See #element()");
    if (!this._data) throw new Error("No data set for ColumnChart. See #data()");

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = this._width - margin.left - margin.right,
    height = this._height - margin.top - margin.bottom;

    // set the ranges
    let x = d3.scaleBand()
              .range([0, width])
              .padding(0.02);
    let y = d3.scaleLinear()
              .range([height, 0]);

    let test = d3.select(this._element).select("svg");


    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    let svg = d3.select(this._element).select("svg").select("g");

    if (svg.empty()) {
      svg = d3.select(this._element)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }

    let data = this._data,
      _x = this._x,
      _y = this._y;

    // Scale the range of the data in the domains
    x.domain(data.map((d) => _x(d)));
    y.domain([0, d3.max(data, (d) => _y(d))]);

    //---------------------------------
    // add the Y gridlines
    svg.call(this.grid, width, y);

    //---------------------------------
    // append the rectangles for the bar chart
    let bars = svg.select(".bars").selectAll('.bar');

    if (bars.empty()) {
      bars = svg
        .append("g")
          .attr("class", "bars")
          .attr("transform", "translate(0, " + height + "), scale(1, -1)")
        .selectAll(".bar");
    }
    bars = bars.data(data);

    let setupBarAttributes = (selection) => {
      selection.attr("x", (d) => x(_x(d)))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", 0)
    }

    bars   // set x and width for existing bars, animating them.
      .interrupt("bar:move")
      .transition("bar:move")
      .call(setupBarAttributes);

    bars.enter()
      .append("rect")                      // Create the geometry
        .attr("class", "bar")
        .call(setupBarAttributes)          // Set x and width for new bars, not animating.
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
          .delay((d,i) => i * 100 )
          .attr("height", (d) => height - y(_y(d)));

    bars.exit().remove();

    // axes
    svg.call(this.xaxis, height, x);
    svg.call(this.yaxis, y);

    svg.selectAll("text")
      .style("fill", colours.eighteen.darkGrey);

  }

  grid(selection, width, yscale) {
    selection.select(".grid").remove();

    let grid = selection.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yscale)
            .tickSize(-width)
            .tickFormat("")
        )

    grid.selectAll("line")
      .style("stroke", colours.eighteen.lightGrey);
    grid.selectAll(".domain").remove()

    grid
      .lower()
      .style("opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1);
  }

  xaxis(selection, height, xscale) {
    selection.select(".x-axis").remove();
    selection.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xscale))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
  }

  yaxis(selection, yscale) {
    selection.select(".y-axis").remove();
    selection.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yscale).tickSize(0).tickPadding(10))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
  }
}
