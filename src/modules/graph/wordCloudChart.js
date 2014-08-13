//--------------------------------------------------------------
// ### Word Clouds

// While this chart uses a similar interface to the previous charts, its expected data format is different,
// as is the kind of data that it displays.
//
// The word cloud is animated and laid out using a layout written for D3 by [Jason Davies][d3.cloud], available
// at github under a BSD license. We've supplied our own copy in the lib directory, which we've patched slightly
// to support setting a seed for the random number generator. This provides a great feature: if you find a
// layout that you like, you can effectively save and replay that.
//
// If you want to stop the animation, call the **stop()** method.
//
// This is an example of a word cloud:
//
// ![Histogram example](http://brandseye.github.io/brandseyejs/images/word-cloud.png)
//
// #### Events
// - elementClick: passed two arguments, the first being the data element associated with the word that
//   was clicked, the second being the dom element that was clicked.
// - tooltipShow: called when the mouse hovers over a word, passing the word and the associated dom object as the
//   first and second objects.
// - tooltipHide: called when the mouse moves off of a word.
//
// [d3.cloud]: https://github.com/jasondavies/d3-cloud
namespace.WordCloudChart = function () {
    namespace.Graph.prototype.createAttributes.call(this);
    this.attributes.seed = Math.floor(Math.random() * 10000);
    // Unlike the other graphs, the default fields for retrieving data for word clouds
    // is *word* and *count*.
    this.attributes.x = function (d) {
        return d.word;
    };
    this.attributes.y = function (d) {
        return d.count;
    };
    this.attributes.font = 'sans-serif';
    this.attributes.layout = 'archimedean';
    this.attributes.minFont = 9;
    this.attributes.maxFont = 70;
    return this;
};

namespace.WordCloudChart.prototype = new namespace.Graph();
namespace.WordCloudChart.prototype.createChart = function () {
    return d3.layout.cloud();
};

namespace.WordCloudChart.prototype.colours = function (_) {
    if (!arguments.length) return this.attributes.colours;
    this.attributes.colours = (_ && _.length) ? _ : brandseye.colours.allColours;
    return this;
};

namespace.WordCloudChart.prototype.setupContainer = function () {
    this.attributes.parent.classed('bm', true)
};
namespace.WordCloudChart.prototype.arrangeLabels = function () {
};

namespace.WordCloudChart.prototype.data = function (data) {
    if (!arguments.length) return this.attributes.data;
    this.attributes.data = data || [];
    return this;
};

namespace.WordCloudChart.prototype.render = function () {
    this.setup();
    var parent = this.attributes.parent = d3.select(this.element());
    this.setupContainer();

    if (parent.selectAll('svg').empty()) {
        parent.append('svg').append('g');
    }

    var x = this.x(),
        y = this.y(),
        width = this.width(),
        height = this.height();

    var svg = this.attributes.svg = parent.select('svg');

    svg
        .select("g")
        .attr("transform", "translate(" + [ Math.floor(width / 2), Math.floor(height / 2) ] + ")");

    var cloud = this.attributes.nvChart;

    var fontSize;
    switch (this.attributes.scale) {
        case 'linear':
            fontSize = d3.scale.linear();
            break;
        case 'square':
            fontSize = d3.scale.sqrt();
            break;
        case 'log':
        default:
            fontSize = d3.scale.log();
    }

    var words = this.getDataToSet();
    var min = Infinity,
        max = -Infinity;
    _(words).each(function (d) {
        if (y(d) < min) min = y(d);
        if (y(d) > max) max = y(d);
    });

    fontSize.domain([min, max]).range([this.attributes.minFont, this.attributes.maxFont]);

    var font = this.attributes.font;

    cloud
        .random(brandseye.utilities.random(this.seed()))
        .spiral(this.attributes.layout)
        .size([width, height])
        .timeInterval(10)
        .text(x)
        .fontSize(function (d) {
            return fontSize(y(d));
        })
        .font(font)
        .rotate(function () {
            return 0;
        })
        .padding(true)
        .on("end", _.bind(this.layoutComplete, this))
        .words(words)
        .start();

};

// This is called after the words have been laid out by the layout
// algorithm. It places the words in the svg container
// and lays them out.
namespace.WordCloudChart.prototype.layoutComplete = function (words) {
    var wordToCount = {};
    var data = this.getDataToSet();
    if (!data.length) return;

    var x = this.x(),
        y = this.y(),
        colours = this.colours();

    _(data).each(function (d) {
        wordToCount[x(d)] = y(d);
    });

    var dispatch = this.dispatch();

    var text = this.attributes.svg.select('g').selectAll("text").data(words);
    text.exit().remove();
    text.enter()
        .append("text")
        .classed('word', true)
        .attr("text-anchor", "middle")
        .on('click', function (d) {
            dispatch.elementClick(d, this);
        });

    text
        .text(function (d) {
            return d.text;
        })
        .style('font-family', this.font())
        .on('mouseover', function (d) {
            dispatch.tooltipShow(d, this);
        })
        .on('mouseout', function (d) {
            dispatch.tooltipHide(d);
        });

    text
        .transition()
        .duration(1000)
        .style("font-size", function (d) {
            return d.size + "px";
        })
        .style("fill", function (d, i) {
            return colours[i % colours.length];
        })
        .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        });
};

namespace.WordCloudChart.prototype.layout = function (_) {
    if (!arguments.length) return this.attributes.layout;
    this.attributes.layout = _;
    return this;
};

// This determines how the different fonts should be scaled to one another.
// There are three choices (specified as a string):
// - *linear*: word sizes are in a direct linear relationship based on their count.
// - *square*: word sizes are related by the square root of their counts.
// - *log*: word sizes are related logarithmically by their counts.
namespace.WordCloudChart.prototype.scale = function (_) {
    if (!arguments.length) return this.attributes.scale;
    this.attributes.scale = _;
    return this;
};

namespace.WordCloudChart.prototype.minFont = function (_) {
    if (!arguments.length) return this.attributes.minFont;
    this.attributes.minFont = _;
    return this;
};

namespace.WordCloudChart.prototype.maxFont = function (_) {
    if (!arguments.length) return this.attributes.maxFont;
    this.attributes.maxFont = _;
    return this;
};

// Sets the font to be used for sizing information. This defaults
// to sans-serif. Please ensure to use the same font as you would when
// rendering the cloud, otherwise you will notice rendering problems, such
// as overlapping words, large spaces between words, and so on.
namespace.WordCloudChart.prototype.font = function (_) {
    if (!arguments.length) return this.attributes.font;
    this.attributes.font = _;
    return this;
};

// This seed value is used to determine the sequence of random values that are used when
// laying out the words. If you would like to use the same layout, use the same seed as previously used.
// Each new instance of *WordCloudChart* will have a seed initialised to a random value by default.
namespace.WordCloudChart.prototype.seed = function (_) {
    if (!arguments.length) return this.attributes.seed;
    this.attributes.seed = _;
    return this;
};

// This stops the animation of the word cloud.
namespace.WordCloudChart.prototype.stop = function () {
    if (this.attributes.nvChart) this.attributes.nvChart.stop();
};
