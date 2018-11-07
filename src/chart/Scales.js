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

import {DateBucket, ContinuousBucket, DiscreteBucket} from "./Bucket";

class Scale {
    constructor() {
        this.getCount = d => d._y;
        this.setCount = (d, v) => d._y = v;
    }

    setCountGetter(y) {
        this.getCount = y;
        return this;
    }

    setCountSetter(y) {
        this.setCount = y;
        return this;
    }
}


class ScaleTime extends Scale {
    transform(val) {
        if (val instanceof Date) return val;
        if (typeof val !== 'string') throw new Error("Value is not a string and cannot be converted to a date");
        return new Date(val);
    }

    buckets(data) {
        return new DateBucket(data)
            .setCountSetter(this.setCount)
            .setCountGetter(this.getCount);
    }

    isShowGrid() { return false };
}

class ScaleIdentity extends Scale  {
    transform(val) {
        return val;
    }

    buckets(data) {
        return new ContinuousBucket(data)
            .setCountSetter(this.setCount)
            .setCountGetter(this.getCount)
    }

    isShowGrid() { return true };
}

class ScaleDiscrete extends Scale  {
    transform(val) {
        return val;
    }

    buckets(data) {
        return new DiscreteBucket(data)
            .setCountSetter(this.setCount)
            .setCountGetter(this.getCount)
    }

    isShowGrid() { return false };
}


export function scaleTime() {
    return new ScaleTime();
}

export function scaleIdentity() {
    return new ScaleIdentity();
}

export function scaleDiscrete() {
    return new ScaleDiscrete();
}

export function chooseScale(exampleValue) {
    if (exampleValue === undefined) throw new Error("No value provided for chooseScale");
    if (Date.parse(exampleValue)) return scaleTime();
    if (exampleValue instanceof Date) return scaleTime();
    if (typeof exampleValue === 'string') return scaleDiscrete();
    if (typeof exampleValue === 'number') return scaleIdentity();

    throw new Error("Unable to determine wanted scale for example value [" + exampleValue + "]");
}