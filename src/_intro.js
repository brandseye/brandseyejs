/*
 * Copyright (C) 2013-2014 BrandsEye (PTY) LTD
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// ## Introduction
// *BrandsEye.js* is a simple library to help with two things:
// 1. Charting. It does this by building on top of [D3][d3] and [nvd3.js][nvd3].
// 2. Pulling data from a [BrandsEye][brandseye] account.
//
// All of the charts are rendered using SVG, are animated, and provide events for showing tooltips and
// providing mouse interaction. It is available at [GitHub][github] under the MIT license. The examples directory
// gives examples of the various bits in use, while this document should help with setting up
// the charts.
//
// *[BrandsEye][brandseye]* is an online platform for social media analysis.
// It provides an [API][api] for accessing the data programmatically, and this library is well suited
// for displaying that data. Indeed, most of the charts in the BrandsEye application are built on top of this
// library.
//
// This library can be divided in to two broad sections:
//
// 1. *The charts*, including bar charts, pie charts, line charts, and word clouds. These can in the most
//    part be used with arbitrary data.
// 2. *Metrics*, which use the charts to display data pulled from a BrandsEye account.
//
// It's certainly possible to use this library to display arbitrary data visually, although it was
// built with the intention of displaying data from the BrandsEye [API][api]. Indeed, it's used to
// create many of the data visualisations offered by the BrandsEye application.
//
// This document can be divided in to the following sections.
//
// 1. A section on the <a href="#utilities">namespaces and utilities</a> provided by the library
// 1. A section on the the basic <a href="#graph-object">charting infrastructure</a> (a charting "parent" object).
// 1. Descriptions of the <a href="#charts">various charts</a> offered by the library.
// 1. A method showing how to <a href="#load">read data from the BrandsEye API</a>.
// 1. A collection of <a href="#metrics">basic metrics</a> built using the charts provided in the library,
//    and pulling data from the BrandsEye API.
// 1. <a href="#appendix">Various helper objects</a> for laying out labels and legends.
//
// There are also examples available:
//
// - A <a href="http://brandseye.github.io/brandseyejs/examples/simple.html">simple example</a> showing how to load a chart.
// - A <a href="http://brandseye.github.io/brandseyejs/examples/gallery.html">gallery of available charts</a>.
// - A <a href="http://brandseye.github.io/brandseyejs/examples/metrics.html">gallery of metrics</a> showing how to load
//   data from the BrandsEye API. These examples do require a BrandsEye API key.
//
// [d3]: http://www.d3js.org
// [nvd3]: http://nvd3.org/
// [api]: https://api.brandseye.com
// [brandseye]: http://www.brandseye.com
// [github]: https://github.com/brandseye/brandseye.js

(function(root, undefined) {

  "use strict";
