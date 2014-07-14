// ### Utilities

// This provides some simple functions used throughout the library, such as tools for generating random numbers,
// exporting charts as SVG, and so on.
brandseye.utilities = function() {

    // #### Private utility members

    var attrs = {
        text: ['font-family', 'font-size', 'font-weight', 'color', 'text-anchor', 'fill',
            'stroke', 'stroke-width', 'stroke-opacity', 'line-height'],
        path: ['stroke', 'stroke-width', 'stroke-opacity', 'shape-rendering', 'fill', 'fill-opacity'],
        rect: ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity'],
        g: ['opacity'],
        line: ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'shape-rendering']
    };

    var inlineSvgCss = function(e) {
        var todo = attrs[e.prop("tagName")];
        if (todo) {
            for (var i = 0; i < todo.length; i++) {
                var attr = todo[i];
                var v = e.css(attr);
                if (v) e.css(attr, v);
            }
        }
        var list = e.children();
        for (i = 0; i < list.length; i++) inlineSvgCss($(list[i]));
    };

    // #### Public utility members
    return {
        // This restricts the length of a string to the given size. This should cut text
        // at word boundaries, and provide ellipses when text has been shortened.
        restrictStringToLength: function(text, length) {
            if (text.length <= length) return text.toString();

            var result = [];
            var word = [];
            for (var i = 0; i < length - 1; i++) {
                var character = text.charAt(i);
                if (character == ' ' || character == '\n') {
                    if (result.length == 0) result = result.concat(word);
                    else {
                        result.push(' ');
                        result = result.concat(word);
                    }
                    word = [];
                } else {
                    word.push(character)
                }
            }

            if (text.length != 0 && result.length == 0) result = text; /* Can happen if the string is a single word longer than length. */
            else result.push('…');

            if (result.length > length) {
                return result.substring(0, length - 1) + '…';
            }

            return result.join('');
        },

        // Given an svg dom element, this will return an xml representation of that
        // element, including have CSS styles embedded in to the xml.
        convertSvgElementToXml: function(svg) {
            var width = svg.width();
            var height = svg.height();

            // The svg begins with a namespace declaration, as well as some other metadata.
            svg.attr('xmlns', "http://www.w3.org/2000/svg");
            svg.attr('width', width);
            svg.attr('height', height);
            svg.attr('version', "1.1");

            // Styles applied via stylesheets need to be inlined.
            inlineSvgCss(svg);

            var xml = svg.parent().html().trim();
            xml = xml.replace(/ class="[^"]+"/g, '');
            // Extra space after some of the translate's breaks canvg and maybe some other stuff
            xml = xml.replace(/ transform="translate \(/g, ' transform="translate(');
            // Remove empty clip-path specifications, which batik, an svg parsing library, does not like
            xml = xml.replace(/clip-path=""/g, '');
            // Some paths are degenerate, and we remove their d value. Batik complains otherwise
            xml = xml.replace(/d="MZ"/g, '');
            // Some charts are generated with x values that Batik does not like.
            xml = xml.replace(/x="NaN"/g, 'x="0"');
            return xml;
        },


        // This removes either single or double quotes from a string.
        // If quoteChar is not specified and the first character of the string is a ' or " then this is used.
        // It will also unescape things that have been escaped inside of the string. Strings that are not quoted are
        // returned as-is.
        removeQuotes: function(text, quoteChar) {
            var n = text.length - 1;
            if (n <= 0) return text;

            if (!quoteChar) {
                quoteChar = text.charAt(0);
                if (quoteChar != '"' && quoteChar != "'") return text;
            } else if (text.charAt(0) != quoteChar) {
                return text;
            }
            if (text.charAt(n) != quoteChar) return text;

            var i = text.indexOf("\\", 1);
            if (i < 0) return text.substring(1, n);
            var o = text.substring(1, i);
            for (; i < n; ) {
                var c = text.charAt(i++);
                if (c == '\\') c = text.charAt(i++);
                o += c;
            }
            return o;
        },

        // Often a value will be a floating point representation of a percentage, which needs
        // to be rounded and given the percentage symbol. This function does that.
        formatPercentage: function(value, round) {
            if (round === undefined) round = 2;
            var base = Math.pow(10, round);
            return (Math.round(value * base) / base).toString() + '%';
        },

        // This formats a number as its SI unit equivalent. For example,
        // 1000 is 1K.
        formatSi: function(number) {
            number = Math.round(number);

            if (number / 1000000000 >= 1) {
                var result = Math.round(number / 1000000000);
                return result + "G";
            }
            if (number / 1000000 >= 1) {
                var result = Math.round(number / 1000000);
                return result + "M";
            }
            if (number / 1000 >= 1) {
                var result = Math.round(number / 1000);
                return result + 'k';
            }

            return number;
        },



        // Returns a pseudo-random number generator function starting with the specified seed.
        // Modified from: http://jacksondunstan.com/articles/393
        random: function(seed) {
            return function() { return (seed = (seed * 9301 + 49297) % 233280) / 233280.0; }
        }
    }
}();