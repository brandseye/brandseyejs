# BrandsEye.js

BrandsEye.js is a javascript library for display graphs, and for pulling data from
a BrandsEye account. It's built on top of D3 and NVD3. 

## Using

BrandsEye.js makes use of the following libraries.

- JQuery
- D3
- NVD3
- Underscore

## Documentation

Documentation can be produced with [docco](http://jashkenas.github.io/docco/) like so:

    docco src/*.js

and can then be found in the doc directory. 

## Examples

There are many examples of the charts, and pulling data from a BrandsEye account, in the 
examples directory. The following examples are provided:

- simple.html, which shows how to display a basic chart
- gallery.html, which shows a list of the various available charts
- metrics.html, which shows how to use the BrandsEye metrics available in BrandsEye.js

Only metrics.html requires a BrandsEye account.

## Distributed code

The following libraries are distributed in the lib directory, along with their associated licenses:

- nvd3 http://nvd3.org/
- D3 Word Cloud Layout https://github.com/jasondavies/d3-cloud This has been patched to provide
  support for repeatable random number generation (hence, repeatable layouts).

## License

Copyright (C) 2013-2014 BrandsEye (PTY) LTD

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
