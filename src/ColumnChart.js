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
    console.log("render()");
    if (!this._element) throw new Error("No element set for ColumnChart. See #element()");
    if (!this._data) throw new Error("No data set for ColumnChart. See #data()");

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    console.log("render ---- [2]");

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
    x.domain(data.map(function(d) { return _x(d); }));
    y.domain([0, d3.max(data, function(d) { return _y(d); })]);

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
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
  }
}
