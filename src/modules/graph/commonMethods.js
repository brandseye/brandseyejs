    // ### Private chart members
    // None of the following our visible outside of the namespace.

    /*
     * Adds tooltips to text items that are children of the selection
     */
    function addTooltips(selection, tooltips) {
        selection.selectAll('text')
            .append('title')
            .text(function(d) {
                if (_(tooltips).isFunction()) return tooltips(d);
                return tooltips && _(tooltips).has(d) ? tooltips[d] : d;
            });
    }

    function overrideAxisLabels(selection, overrides) {
        if (!overrides) return;

        selection
            .selectAll('text')
            .each(function(data) {
                if (overrides[data]) {
                    d3.select(this).text(overrides[data]);
                }
            });
    }

    var backgroundColour = '#f8f8f8';
    var defaultLabelRestriction = 15;
    var xAxisRestriction = 25;
    var loadingText = '';
    var dateRegex = /^\d+-\d+-\d+(\s\d\d:\d\d)?$/;

    /*
     * Attempts to limit the text of x-axis labels to an appropriate length.
     * It tries to do this with some level of aesthetic awareness, by first
     * reducing text from the kinds of labels it recognises (such as unwanted
     * information from twitter and facebook, or web urls).
     */
    function xAxisTickFormat(restriction, text) {
        text = text.toString();
        if (!restriction) restriction = defaultLabelRestriction;
        if (text.length <= restriction) return text;

        var facebookRegex = /^(\w+)\s+\d+$/;
        var twitterRegex = /^(\w+)\s+\([\w\s]+\)$/;
        var webpage = /^www\.(\w+)\..*$/

        var match;
        if (match = text.match(facebookRegex)) {
            text = match[1] + '…';
        }
        else if (match = text.match(twitterRegex)) {
            text = match[1] + '…';
        }
        else if (match = text.match(webpage)) {
            text = match[1] + '…';
        }

        return brandseye.utilities.restrictStringToLength(text, restriction);
    }

    /*
     * Marks bars with .unknown and .other classes.
     */
    function markUnknownAndOthers(selection, x, klass, extractor) {
        if (!klass) klass = '.nv-bar';
        if (!extractor) extractor = _.identity;
        selection.selectAll(klass).each(function(d) {
            d = extractor(d);
            var other = false,
                unknown = false;
            if (_(x(d)).isString()) {
                var lower = x(d).toLowerCase();
                other = lower === 'others';
                unknown = lower === 'unknown';
            }
            d3.select(this)
                .classed('other', other)
                .classed('unknown', unknown);
        });
    }

    /*
     * Sets up the event handlers that fire when tooltips are shown / hidden, and on mouse clicks.
     */
    function setupDispatcher(dispatch, container, originalDispatch, tooltipDispatch, originalData, selector, transformData) {
        if (_(transformData).isUndefined()) transformData = _.identity;
        originalDispatch.on('elementClick', function(data) {
            dispatch.elementClick(data);
        });

        tooltipDispatch.on('tooltipShow', function(data) {
            dispatch.tooltipShow(data);
        });

        tooltipDispatch.on('tooltipHide', function(data) {
            dispatch.tooltipHide(data);
        });

        container.selectAll(selector).on('mouseup', function(d) {
            var data = {
                point: transformData(d),
                e: d3.event,
                series: originalData[d.series]
            };
            if (d3.event.which == 2) dispatch.elementMiddleClick(data);
            if (d3.event.which == 3) dispatch.elementRightClick(data);
        });
    }