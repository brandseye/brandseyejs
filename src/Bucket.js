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

import {freedmanDiaconis} from "./Statistics";

/**
 * The bucket of a Date object is just itself. We assume that
 * dates are their own buckets.
 */
export class DateBucket {
    constructor(data) {

    }

    // A noop: each date is its own bucket.
    bucket(d) {
        return d;
    }

    // A noop: our buckets are already consolidated.
    consolidateBuckets(data) {
        return data;
    }
}


export class ContinuousBucket {
    // We calculate buckets based on the Freedman-Draconis
    // inter-quartile range method.
    constructor(data) {
        this._bucketWidth = freedmanDiaconis(data);
    }

    bucket(d) {
        const b = Math.floor(d / this._bucketWidth);
        return Math.ceil(b * this._bucketWidth + this._bucketWidth);
    }

    consolidateBuckets(data) {
        data.forEach(bucket => {
            const counts = {};
            const examples = {};
            // Count everything grouped by their keys
            // (i.e. count individual series
            bucket.data.forEach(d => {
                counts[d._key] = (counts[d._key] || 0) + 1;
                examples[d._key] = d;
            });
            // Provide one summary per series, but preserve
            // any extra data, such as colour and so on.
            bucket.data = Object.keys(counts).map(key => {
                const example = examples[key];
                return Object.assign({}, example, {
                    _y: counts[key]
                })
            })
        });

        return data;
    }
}