import { colours } from './Colours';


export class ColumnChart {
  constructor() {
    this._x = (d) => d.x;
    this._y = (d) => d.y;
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

  render() {
    if (!this._element) throw new Error("No element set for ColumnChart. See #element()");
    if (!this._data) throw new Error("No data set for ColumnChart. See #data()");

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleBand()
              .range([0, width])
              .padding(0.02);
    var y = d3.scaleLinear()
              .range([height, 0]);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3
      .select(this._element)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    let data = this._data,
      _x = this._x,
      _y = this._y;

    // Scale the range of the data in the domains
    x.domain(data.map((d) => _x(d)));
    y.domain([0, d3.max(data, (d) => _y(d))]);

    //---------------------------------
    // add the Y gridlines
    let grid = svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )

    svg.selectAll(".grid line")
      .style("stroke", colours.eighteen.lightGrey);
    svg.selectAll(".grid .domain")
      .style("opacity", 0);

    grid.style("opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1);

    //---------------------------------
    // append the rectangles for the bar chart
    let bars = svg
      .append("g")
        .attr("transform", "translate(0, " + height + "), scale(1, -1)")
      .selectAll(".bar")
        .data(data)

    bars.enter()
      .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(_x(d)))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .style("fill", colours.eighteen.midGrey)
      .transition()
        .delay((d,i) => i * 100 )
        .attr("height", (d) => height - y(_y(d)));

    // add the x Axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // add the y Axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    svg.selectAll("text")
      .style("fill", colours.eighteen.darkGrey);

  }
}
