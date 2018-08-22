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

    constructor() {
        this._chart_x_getter = null;
        this._chart_y_getter = null;
        this._x_getter = null;
        this._y_getter = null;
        this._colour = null;
        this._size = null;
        this._scale_x = null;
        this._scale_y = null;
        this._facet_selector = null;
        this._chart_colour_scale = null;
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

    y(getter) {
        if (arguments.length === 0) return this._y_getter || this._chart_y_getter;
        if (typeof getter !== 'function') throw new Error("y getter must be a function");
        this._y_getter = getter;
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

    data(data) {
        if (arguments.length === 0) return this._data;
        this._data = data;
        return this;
    }

    facet(selector) {
        if (arguments.length === 0) return this._facet_selector;
        if (typeof selector !== 'function' && selector !== null) throw new Error("Facet selector must be a function");
        this._facet_selector = selector;
        return this;
    }


    /*
     * This takes our array of data, and determines what elements
     * are to be mapped to what aesthetic values, such as colour or size.
     * Data is groupped by these fields.

     */
    prepareData(data) {
        data = data || this._data;
        if (!data || !data.length) return [];

        const x = this.x(),
              y = this.y(),
              scaleX = this.scaleX(),
              scaleY = this.scaleY();

        let mapped = {};

        data.forEach(d => {
            const object = Object.assign({
                _x: scaleX.transform(x(d)),
                _y: scaleY.transform(y(d)),
                _colour: this.colour()(d),
                _size: this.size()(d)
            }, d);

            const key = getKey(object);
            object._key = key;

            let series = mapped[key] || getKeyParameters(object);
            series.data.push(object);
            mapped[key] = series;
        });

        return Object.values(mapped);
    }


    /**
     * Implement your render code here.
     */
    render() {
        console.warn("RENDER NOT IMPLEMENTED")
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

function getKey(d) {
    return "" + d._size + ":" + d._colour;
}

function getKeyParameters(d) {
    return {
        _key: getKey(d),
        _size: d._size,
        _colour: d._colour,
        data: []
    }
}