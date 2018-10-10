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

/**
 * Limits the length of a string, and places ellipses if this happens.
 * @param text
 * @param length
 * @returns {*}
 */
export function restrictLength(text, length) {
    if (text.length <= length) return text;

    var result = [];
    var word = [];
    for (let i = 0; i < length - 1; i++) {
        var character = text.charAt(i);
        if (character === ' ' || character === '\n') {
            if (result.length === 0) result = result.concat(word);
            else {
                result.push(' ');
                result = result.concat(word);
            }
            word = [];
        } else {
            word.push(character)
        }
    }

    if (text.length !== 0 && result.length === 0) result = text; // Can happen if the string is a single word longer than length.
    else result.push('…');

    if (result.length > length) {
        return result.substring(0, length - 1) + '…';
    }

    return result.join('');
}