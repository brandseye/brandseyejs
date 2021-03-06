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


export class Geometry {

    constructor(name, priority) {
        this._name = name || "[UNNAMED GEOMETRY]";
        this._chart_x_getter = null;
        this._chart_y_getter = null;
        this._x_getter = null;
        this._x2_getter = null;
        this._y_getter = null;
        this._y2_getter = null;
        this._colour = null;
        this._size = null;
        this._scale_x = null;
        this._scale_y = null;
        this._axis_max_value = null;
        this._axis_min_value = null;
        this._facet_selector = null;
        this._chart_colour_scale = null;
        this._colour_scale = null;
        this._individual_colours = null;
        this._chart_individual_colours = null;
        this._modify_colour = null;
        this._chart_modify_colour = null;
        this._x_formatter = null;
        this._y_formatter = null;
        this._chart_x_formatter = null;
        this._chart_y_formatter = null;
        this._y_axis_label = null;
        this._x_axis_label = null;
        this._chart_y_axis_label = null;
        this._chart_x_axis_label = null;
        this._label_formatter = null;
        this._chart_label_formatter = null;
        this._priority = priority || 1;
        this._dispatch = d3.dispatch('elementClick', 'elementMiddleClick', 'elementRightClick',
            'tooltipShow', 'tooltipHide');
        this._show_labels = null;
        this._chart_show_labels = null;
        this._d3_colour_scale = null;
        this._stroke_width = null;
        this._font_size = 12;
        this._padding = 0;
        this._use_y2_axis = false;
        this._gradient_fn = null;
        this._opacity = null
        this._index = 0;  // Used for generating unique keys
        this._no_animation = false;
        this._stacked = false
    }

    name() {
        return this._name;
    }

    /**
     * Used for generating a unique key.
     */
    index(i) {
        if (arguments.length === 0) return this._index;
        this._index = i;
        return this;
    }

    /** Use stacked bars. */
    stacked(on) {
        if (arguments.length === 0) return this._stacked;
        this._stacked = on;
        return this;
    }

    noAnimation(on) {
        if (arguments.length === 0) return this._no_animation;
        this._no_animation = on;
        return this;
    }

    key() {
        return `${this._index}:${this._name}`
    }

    /**
     * Provides a sort order priority for metrics. Metrics with a higher priority
     * are drawn on top of lower priority metrics.
     */
    priority() {
        return this._priority;
    }

    element(el) {
        if (arguments.length === 0) return this._element;
        this._element = el;
        return this;
    }

    x(getter) {
        if (arguments.length === 0) return this._x_getter || this._chart_x_getter;
        if (typeof getter !== 'function') throw new Error("x getter must be a function");
        this._x_getter = getter;
        return this;
    }

    x2(getter) {
        if (arguments.length === 0) return this._x2_getter
        if (getter && typeof getter !== 'function') throw new Error("x2 getter must be a function");
        this._x2_getter = getter;
        return this;
    }

    y(getter) {
        if (arguments.length === 0) return this._y_getter || this._chart_y_getter;
        if (typeof getter !== 'function') throw new Error("y getter must be a function");
        this._y_getter = getter;
        return this;
    }

    y2(getter) {
        if (arguments.length === 0) return this._y2_getter;
        if (getter && typeof getter !== 'function') throw new Error("y2 getter must be a function");
        this._y2_getter = getter;
        return this;
    }

    setupX(getter) {
        if (arguments.length === 0) return this._chart_x_getter;
        if (typeof getter !== 'function') throw new Error("x getter must be a function");
        this._chart_x_getter = getter;
        return this;
    }

    setupY(getter) {
        if (arguments.length === 0) return this._chart_y_getter;
        if (typeof getter !== 'function') throw new Error("y getter must be a function");
        this._chart_y_getter = getter;
        return this;
    }

    colour(colour) {
        if (arguments.length === 0) return this._colour || this._chart_colour;
        this._colour = colour;
        return this;
    }

    setupColour(colour) {
        if (arguments.length === 0) return this._chart_colour;
        this._chart_colour = colour;
        return this;
    }

    colourScale(colours) {
        if (arguments.length === 0) return this._chart_colour_scale || this._colour_scale;
        if (typeof colours !== 'object' || !colours.length) throw new Error("colour must be an Array");
        this._colour_scale = colours;
        return this;
    }

    setupColourScale(colours) {
        if (arguments.length === 0) return this._chart_colour_scale;
        if (typeof colours !== 'object' || !colours.length) throw new Error("colour must be an Array");
        this._chart_colour_scale = colours;
        return this;
    }

    individualColours(colourMap) {
        if (arguments.length === 0) return this._individual_colours || this._chart_individual_colours;
        this._individual_colours = colourMap;
        return this;
    }

    setupIndividualColours(colourMap) {
        if (arguments.length === 0) return this._chart_individual_colours;
        this._chart_individual_colours = colourMap;
        return this;
    }

    modifyColour(modifier) {
        if (arguments.length === 0) return this._modify_colour || this._chart_modify_colour;
        this._modify_colour = modifier;
        return this;
    }

    setupModifyColour(modifier) {
        if (arguments.length === 0) return this._chart_modify_colour;
        this._chart_modify_colour = modifier;
        return this;
    }

    d3ColourScale(scale) {
        if (arguments.length === 0) return this._d3_colour_scale;
        this._d3_colour_scale = scale;
        return this;
    }

    getD3Colour(d) {
        return getColor(d, this.d3ColourScale(), this.individualColours(), this.modifyColour());
    }

    size(size) {
        if (arguments.length === 0) return this._size || this._chart_size;
        this._size = size;
        return this;
    }

    setupSize(size) {
        if (arguments.length === 0) return this._chart_size;
        this._chart_size = size;
        return this;
    }

    scaleX(scale) {
        if (arguments.length === 0) return this._scale_x || this._chart_scale_x;
        this._scale_x = scale;
        return this;
    }

    setupScaleX(scale) {
        if (arguments.length === 0) return this._chart_scale_x;
        this._chart_scale_x = scale;
        return this;
    }

    scaleY(scale) {
        if (arguments.length === 0) return this._scale_y || this._chart_scale_y;
        this._scale_y = scale;
        return this;
    }

    setupScaleY(scale) {
        if (arguments.length === 0) return this._chart_scale_y;
        this._chart_scale_y = scale;
        return this;
    }

    formatX(formatter) {
        if (arguments.length === 0) return this._x_formatter || this._chart_x_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._x_formatter = formatter;
        return this;
    }

    setupFormatX(formatter) {
        if (arguments.length === 0) return this._chart_x_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._chart_x_formatter = formatter;
        return this;
    }

    formatY(formatter) {
        if (arguments.length === 0) return this._y_formatter || this._chart_y_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._y_formatter = formatter;
        return this;
    }

    setupFormatY(formatter) {
        if (arguments.length === 0) return this._chart_y_formatter;
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._chart_y_formatter = formatter;
        return this;
    }

    formatLabel(formatter) {
        if (arguments.length === 0) return this._label_formatter || this._chart_label_formatter || this.formatY();
        if (typeof formatter !== 'function') throw new Error("formatter must be a function");
        this._label_formatter = formatter;
        return this;
    }

    setupFormatLabel(formatter) {
        if (arguments.length === 0) return this._chart_label_formatter;
        this._chart_label_formatter = formatter;
        return this;
    }

    width(width) {
        if (arguments.length === 0) return this._width;
        this._width = width;
        return this;
    }

    height(height) {
        if (arguments.length === 0) return this._height;
        this._height = height;
        return this;
    }

    axisMaxValue(v) {
        if (arguments.length === 0) return this._axis_max_value;
        this._axis_max_value = v;
        return this;
    }

    axisMinValue(v) {
        if (arguments.length === 0) return this._axis_min_value;
        this._axis_min_value = v;
        return this;
    }

    showLabels(show) {
        if (arguments.length === 0) return this._chart_show_labels || this._show_labels;
        this._show_labels = !!show;
        return this;
    }

    setupShowLabels(show) {
        if (arguments.length === 0) return this._chart_show_labels;
        this._chart_show_labels = !!show;
        return this;
    }

    yAxisLabel(label) {
        if (arguments.length === 0) return this._chart_y_axis_label || this._y_axis_label;
        this._y_axis_label = label;
        return this;
    }

    setupYAxisLabel(label) {
        if (arguments.length === 0) return this._chart_y_axis_label;
        this._chart_y_axis_label = label;
        return this;
    }

    xAxisLabel(label) {
        if (arguments.length === 0) return this._chart_x_axis_label || this._x_axis_label;
        this._x_axis_label = label;
        return this;
    }

    setupXAxisLabel(label) {
        if (arguments.length === 0) return this._chart_x_axis_label;
        this._chart_x_axis_label = label;
        return this;
    }

    gradientFn(fn) {
        if (arguments.length === 0) return this._gradient_fn;
        if (fn && typeof fn !== "function") throw new Error("gradientFn must be a function");
        this._gradient_fn = fn;
        return this;
    }

    opacity(v) {
        if (arguments.length === 0) return this._opacity;
        if (v && typeof v !== "number") throw new Error("opacity must be a number");
        this._opacity = v;
        return this;
    }

    immediatelyRenderLabels(show) {
        console.warn("#immediatelyRenderLabels not implemented for", this.name());
    }

    data(data) {
        if (arguments.length === 0) return this._data;
        this._data = data;
        return this;
    }

    facet(selector) {
        if (arguments.length === 0) return this._facet_selector;
        if (selector != null && typeof selector !== 'function' && selector !== null) throw new Error("Facet selector must be a function");
        this._facet_selector = selector;
        return this;
    }

    strokeWidth(pixels) {
        if (arguments.length === 0) return this._stroke_width;
        this._stroke_width = pixels;
        return this;
    }

    fontSize(px) {
        if (arguments.length === 0) return this._font_size;
        if (typeof px !== "number" && px > 0) throw new Error("fontSize must be a positive number");
        this._font_size = px;
        return this;
    }

    padding(padding) {
        if (arguments.length === 0) return this._padding;
        this._padding = padding;
        return this;
    }

    useY2Axis(on) {
        if (arguments.length === 0) return this._use_y2_axis;
        this._use_y2_axis = !!on;
        return this;
    }

    /*
     * This takes our array of data, and determines what elements
     * are to be mapped to what aesthetic values, such as colour or size.
     * Data is grouped by these fields.
     */
    prepareData(data, faceted) {
        faceted = !!faceted && this.facet();
        data = data || this._data;
        if (!data || !data.length) return [];

        const x = this.x(),
              x2 = this.x2(),
              y = this.y(),
              y2 = this.y2(),
              scaleX = this.scaleX(),
              scaleY = this.scaleY();

        let mapped = {};

        data.forEach(d => {
            if (faceted && !this.facet()(d)) return;
            const object = Object.assign({
                _x: scaleX.transform(x(d)),
                _y: scaleY.transform(y(d)),
                _colour: this.colour()(d),
                _size: this.size()(d)
            }, d);
            if (x2) object._x2 = scaleX.transform(x2(d))
            if (y2) object._y2 = scaleY.transform(y2(d))

            const key = getKey(object);
            object._key = key;

            let series = mapped[key] || getKeyParameters(object);
            series.data.push(object);
            mapped[key] = series;
        });

        return Object.values(mapped);
    }

    getD3XScale() {
        throw new Error("getD3XScale not implemented for " + this.name());
    }

    getD3YScale() {
        throw new Error("getD3YScale not implemented for " + this.name());
    }

    /**
     * Get all the Y values for this geometry, ignoring faceting.
     */
    yValues() {
        return this.data()
            .map(d => this.y()(d))
            .map(d => this.scaleY().transform(d));
    }

    /**
     * Get all the X values for this geometry, ignoring faceting.
     */
    xValues() {
        return this.data()
                   .map(d => this.x()(d))
                   .map(d => this.scaleX().transform(d));
    }


    /**
     * Implement your render code here.
     */
    render() {
        throw new Error("RENDER NOT IMPLEMENTED FOR " + this.name());
    }


    /**
     * Returns the unique values that the colour function
     * returns.
     * @param data
     * @returns {*}
     */
    getColourDomain(data) {
        if (!data || !data.length) return [];

        const colours = new Set();

        // todo calculate buckets
        data.forEach(series => {
            series.data.forEach(d => {
                colours.add(this.colour()(d))
            });
        });

        return [...colours]
    }

}

export function getColor(d, d3ColourScale, individualColours, modifyColour) {
        const defaultColour = d3ColourScale(d._colour);
        return modifyColour(individualColours(d, defaultColour) || defaultColour);
}

export function getKey(d) {
    // TODO we probably need to encode this better so we can split on the :
    return "" + d._colour;
}

export function fromKey(key) {
    return {
        _colour: key,
        _key: key
    }
}

function getKeyParameters(d) {
    return {
        _key: getKey(d),
        _size: d._size,
        _colour: d._colour,
        data: []
    }
}