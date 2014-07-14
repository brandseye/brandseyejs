var brandseye =  {};

// ### Changes
// We version the library using [semantic versioning](http://semver.org/).
//
// - 1.3.0: We now use gulpjs to build the brandseyejs library.
// - 1.2.3: Fixed a bug in which hourly labels are wrongly rotated at the beginning of a month.
// - 1.2.2: Fixed a bug in which some labels may be rotated, but not others
// - 1.2.1: Fixed a bug in which the support for hours broke the highlighting of the beginning of the month
//          in the histogram.
// - 1.2.0: Histogram now supports an "hourly" coarseness.
// - 1.1.2: bug fix: some charts are produced with an x value that Batik does not like.
// - 1.1.1: BarCharts and ColumnCharts were incorrectly formatting data labels.
// - 1.1.0: the elementClick and tooltipShow events on the word cloud now passes the dom element that was clicked
//          as the second argument to the event.
// - 1.0.0: Initial release
brandseye.VERSION = '1.3.0';


// Export to the root, which is probably `window`.
root.brandseye = brandseye;
