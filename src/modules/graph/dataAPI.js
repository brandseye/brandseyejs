//----------------------------------------
// <a id="load"></a>
// ## Reading data from the API

// The address of the BrandsEye API server is https://api.brandseye.com. This is a restful,
// json api. You can visit the page to view the documentation on the api. When asked for a username / password,
// you can use your, you can use the username API_KEY and use your api key as the password.
// Please contact your client service representative if you need to find out what your api key is.
namespace.brandsEyeApi = "https://api.brandseye.com";

// **loadFromApi()** is a helper function to load data from the api. You very likely would want
// to only use this when testing the library, as it will expose your api key in your
// client side code. By default it will return data from the *count* endpoint of the BrandsEye API,
// although that can be overridden using the *fragment* option below.
//
// The function takes a number of possible arguments.
// - *username*: username for accessing the data server (see the *key* option below).
// - *password*: password for accessing the data server (see the *key* option below).
// - *server*: an optional argument for the server to use. If not filled in, the default BrandsEye API server will be used.
// - *key*: An api key to use instead of a username/password pair.
// - *max*: An integer giving the maximum number of items to show (optional).
// - *showOthers*: A boolean, default true, used in conjunction with max above. If true, those items
//   not shown because they exceed the max field will be rolled in to an *Other* field.
// - *xFieldName*: The name of the field in which the x value is stored. This is needed when showing others.
// - *fragment*: Optional string. Apart from providing an account code, you may provide a whole fragment string
//   representing the API endpoint that you wish to access. For example, rest/accounts/QUIR01BA/mentions/ots
// - *groupby*: An optional string of comma separated values for grouping the resulting data.
// - *orderby*: An optional string of comma separated values for ordering the resulting data.
// - *arguments*: An optional map of extra arguments to append to the url.
// - *callback*: a function that will be called on success. It will be passed the data returned from the API.
// - *error*: An optional function called on failure.
//
// An example of its use:
//
//     brandseye.charts.loadFromApi({
//         key: "your key,
//         account: "your account code",
//         filter: "published inthelast week and sentiment > 1",
//         groupby: "published",
//         success: function(data) { console.log("Received", data); }
//     });
//
// ### Caveats on its use
// Using this function on the client-side *will* expose your API key. To prevent this, you should
// proxy all calls to our server via your own servers. By changing the **brandseye.charts.brandsEyeAPI** field,
// you can have this method talk to your own servers, using a user supplied username and password. Or, alternatively,
// this function works well in both [node][node] and [phantomJS][phantomjs].
//
// [node]: http://nodejs.org/
// [phantomjs]: http://phantomjs.org/

namespace.loadFromApi = function (options) {
    if (!options.account && !options.fragment) {
        throw new Error("Please specify an account");
    }

    var username = options.username || "API_KEY",
        password = options.password || options.key,
        server = options.server || namespace.brandsEyeApi,
        callback = options.success,
        authorisation = "Basic " + btoa(username + ":" + password),
        fragment = options.fragment || "rest/accounts/" + options.account + "/mentions/count";

    if (options.showOthers === undefined) options.showOthers = true;
    if (options.max && options.showOthers) options.max = options.max - 1;
    if (options.max && options.showOthers && !options.xFieldName) throw new Error("xFieldName must be set when showing Other values");

    var args = [];
    args.push("Authorization=" + authorisation);
    if (options.arguments) {
        for (var key in options.arguments) {
            args.push(key + "=" + encodeURIComponent(options.arguments[key]));
        }
    }

    if (options.groupby) args.push("groupby=" + encodeURIComponent(options.groupby));
    if (options.filter) args.push("filter=" + encodeURIComponent(options.filter));
    if (options.orderby) args.push("orderby=" + encodeURIComponent(options.orderby));
    if (options.include) args.push("include=" + encodeURIComponent(options.include));

    var url = server + "/" + fragment + "?" + args.join('&');

    return $.ajax({
        url: url,
        contentType: "application/json",
        dataType: 'jsonp',
        success: function (data) {
            if (data.status === 401) {
                throw new Error("You are not authorised to access this endpoint");
            }
            if (data.status) {
                throw new Error(data.error);
            }
            if (options.max) {
                var originalData = data;
                data = _(data).take(options.max);
                if (options.showOthers) {
                    var others = _.chain(originalData)
                        .rest(options.max)
                        .reduce(function (memo, num) {
                            return {
                                count: memo.count + (num.count || 0),
                                ave: memo.ave + (num.ave || 0),
                                ots: memo.ots + (num.ots || 0),
                                percentage: memo.percentage + (num.percentage || 0),
                                credibility: memo.credibility + (num.credibility || 0)
                            };
                        }, {count: 0, ave: 0, ots: 0, percentage: 0, credibility: 0, reach: 0, engagement: 0})
                        .value();
                    others[options.xFieldName] = "Others";
                    data.push(others);
                }
            }
            callback(data);
        },
        error: function () {
            if (options.error) options.error();
            else throw new Error("There was an error communicating with the API");
        }
    });
};

//--------------------------------------------------------------
// <a id="metrics"></a>
// ## The Metrics
// This section creates various example metrics. All of these can be used in your application,
// or can be used to show how to pull appropriate data from the [BrandsEye API](https://api.brandseye.com).
// They are quite simple implementations, however, and don't directly
// support various features such as comparison data sets (multiple series),
//
// ### Support objects: BrandsEyeMetric

// This provides a way of easily defining graphs that query the [BrandsEye API](https://api.brandseye.com) and hence
// have a lot of shared boilerplate code in terms of setting up the call to the API and then displaying
// the data. This function has a way to set up a query on a particular account, initialises the graph
// with the appropriate type, and then provides easy access to the graph in order to customise it.
// There are various examples below of this happening.
//
// The **loadFromApi()** function is defined further below.
//
// Showing a metric is simple, and makes use of the **run()** method, which
// begins the process of downloading the data:
//
//     // Define the account, api key, and filter to use
//     var metric = new brandseye.charts.VolumeMetric({
//         account: "BEMF33AA",
//         key: 'your api key',
//         filter: "published inthelast week"
//     });
//
//     // Specify the element's height/width and supply
//     // a dom object to render to.
//     metric.run(function (chart, data) {
//          console.log("This is the data we received", data);
//
//          // Notice that we don't need to set the data.
//          // It has already been set.
//          chart
//              .element(element)
//              .width(512)
//              .height(350)
//              .render();
//     });
//
namespace.BrandsEyeMetric = function (options) {
    this.query = options.query;
    this.type = options.type;
    this.__proto__ = new this.type;

    var chart = this;
    var dataTransform = options.dataTransform || _.identity;

    this.run = function (callback) {
        namespace.loadFromApi({
            key: options.query.key,
            account: options.query.account,
            filter: options.query.filter,
            groupby: options.query.groupby,
            orderby: options.query.orderby,
            include: options.query.include,
            max: options.query.max,
            xFieldName: options.query.xFieldName,
            fragment: options.query.fragment,
            arguments: options.query.arguments,

            success: function (data) {
                data = dataTransform(data);
                chart.data(data);
                callback(chart, data);
            }
        });
    };

    return this;
};


// ### Showing volumes

// This displays a histogram showing the number of mentions
// received in a given time period.
namespace.VolumeMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            groupby: "published"
        },
        type: options.type || namespace.Histogram
    });

    this
        .x(function (d) {
            return d.published;
        })
        .y(function (d) {
            return d.count;
        })
        .tickFormat(brandseye.utilities.formatSi)
        .dataAxisLabel("Volume");

    return this;
};


// ### Opportunity-to-see

// This displays a histogram showing the OTS over a given time period.
namespace.OtsMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            include: 'ots',
            key: options.key,
            groupby: "published"
        },
        type: options.type || namespace.Histogram
    });

    this
        .x(function (d) {
            return d.published;
        })
        .y(function (d) {
            return d.ots;
        })
        .tickFormat(brandseye.utilities.formatSi)
        .dataAxisLabel({long: "Opportunity to see", short: "OTS"});

    return this;
};


// ### Advert-value-equivalent

// This displays a histogram showing the AVE over a given time period. These values
// are by default in Rands (ZAR).
namespace.AveMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            include: 'ave',
            key: options.key,
            groupby: "published"
        },
        type: options.type || namespace.Histogram
    });

    this
        .x(function (d) {
            return d.published;
        })
        .y(function (d) {
            return d.ave;
        })
        .tickFormat(function (d) {
            return "R" + brandseye.utilities.formatSi(d);
        })
        .dataAxisLabel({long: "Ad-value equivalent", short: "AVE"});

    return this;
};


// ### Engagement

// This displays a histogram showing a breakdown of engagement over time.
namespace.EngagementMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            include: 'engagement',
            key: options.key,
            groupby: "published"
        },
        type: options.type || namespace.Histogram
    });

    this
        .x(function (d) {
            return d.published;
        })
        .y(function (d) {
            return d.engagement;
        })
        .dataAxisLabel({long: "Engagement", short: "Engagement"});

    return this;
};


// ### Categories

// Shows a column chart breaking showing the distribution of mentions between
// different categories of:
//
// - press
// - enterprise
// - consumer
// - directory
namespace.CategoryMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            groupby: "media",
            include: "percentages",
            orderby: "count desc"
        },
        type: options.type || namespace.ColumnChart
    });

    this
        .x(function (d) {
            return d.media;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        .xAxisOverride({
            "PRESS": "Press",
            "CONSUMER": "Consumer",
            "ENTERPRISE": "Enterprise",
            "DIRECTORY": "Directory",
            "UNKNOWN": "Unknown"
        })
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by category");

    return this;
};


// ### Countries

// Shows a break down of volume by country.
namespace.CountryMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            include: "percentages",
            groupby: "country",
            orderby: "count desc",
            max: 8,
            xFieldName: "countryName"
        },
        type: options.type || namespace.BarChart
    });

    this
        .x(function (d) {
            return d.countryName || d.country;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by country");

    return this;
};


// ### Language

// Shows a break down of volume by language
namespace.LanguageMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            include: "percentages",
            groupby: "language",
            orderby: "count desc",
            max: 8,
            xFieldName: "languageName"
        },
        type: options.type || namespace.BarChart
    });

    this
        .x(function (d) {
            return d.languageName || d.language;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by language");

    return this;
};


// ### Gender

// Shows a break down of volume by gender.
namespace.GenderMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            include: "percentages",
            groupby: "gender",
            orderby: "count desc"
        },
        type: options.type || namespace.BarChart
    });

    this
        .x(function (d) {
            return d.gender;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        // The API doesn't return very displayed names for the gender options.
        // Here we override how they should be displayed, just to neaten them up
        // somewhat.
        .xAxisOverride({
            "FEMALE": "Female",
            "MALE": "Male",
            "OTHER": "Other",
            "UNKNOWN": "Unknown"

        })
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by gender");

    return this;
};


// ### Sentiment

// Volume by sentiment
namespace.SentimentMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            include: "percentages",
            groupby: "sentiment",
            orderby: "sentiment"
        },
        type: options.type || namespace.BarChart
    });

    this
        .x(function (d) {
            return d.sentimentName || d.sentiment;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by sentiment");

    return this;
};


// ### Sources

// The top sources that mentions come from
namespace.SourceMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            include: "percentages",
            groupby: "site",
            orderby: "count desc",
            max: 6,
            xFieldName: "site"
        },
        type: options.type || namespace.PieChart
    });

    this
        .x(function (d) {
            return d.site;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by source");

    return this;
};


// ### Mentions by author

// Mention volumes broken down by author.
namespace.AuthorMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            account: options.account,
            key: options.key,
            include: "percentages",
            groupby: "authorName",
            orderby: "count desc",
            max: 6,
            xFieldName: "authorName"
        },
        type: options.type || namespace.ColumnChart
    });

    this
        .x(function (d) {
            return d.authorName;
        })
        .y(function (d) {
            return d.percentage;
        })
        .showLabels(true)
        // Here we only override a single option: the UNKNOWN
        // author is made to print prettier. Notice that you don't
        // need to override everything, but can selectively do so.
        .xAxisOverride({
            "UNKNOWN": "Unknown"
        })
        .labelFormat(brandseye.utilities.formatPercentage)
        .dataAxisLabel("% of mentions by source");

    return this;
};


// ### Reputation

// A line chart showing the basic reputation of the brand.
namespace.ReputationMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            key: options.key,
            fragment: "rest/accounts/" + options.account + "/score",
            arguments: {
                rootsOnly: true
            }
        },
        type: options.type || namespace.LineChart,
        dataTransform: function (data) {
            data = _(data).chain()
                .groupBy('brandId')
                .values()
                .filter(function (data) {
                    return !data[0].deleted;
                })
                .map(function (data) {
                    return {
                        key: data[0].brand,
                        values: data
                    }
                })
                .value();
            return data;
        }
    });

    this
        .x(function (d) {
            console.log(d.date)
            return d.date;
        })
        .y(function (d) {
            return d.score;
        })
        .showLabels(true);

    return this;
};

// ### A word cloud

// Shows the distribution of words in selected mentions.
namespace.WordCloudMetric = function (options) {
    namespace.BrandsEyeMetric.call(this, {
        query: {
            filter: options.filter,
            key: options.key,
            fragment: "rest/accounts/" + options.account + "/mentions/words",
            arguments: {
                rootsOnly: true,
                limit: 100
            }
        },
        type: options.type || namespace.WordCloudChart,
        dataTransform: function (data) {
            return data.data;
        }
    });

    return this;
};
