/**
 * WSGI search from QGIS Web Client
 */

function WsgiSearch(url) {
  // search URL
  this.url = url;
};

// inherit from Search
WsgiSearch.prototype = new Search();

/**
 * submit search query
 */
WsgiSearch.prototype.submit = function(searchParams, callback) {
  var request = $.ajax({
    url: this.url,
    data: {
      query: $.trim(searchParams)
    },
    dataType: 'json',
    context: this
  });

  request.done(function(data, status) {
    this.parseResults(data, status, callback);
  });

  request.fail(function(jqXHR, status) {
    alert(I18n.search.failed + "\n" + jqXHR.status + ": " + jqXHR.statusText);
  });
};

/**
 * parse query result and invoke the callback with search result features
 *
 * [
 *   {
 *     category: <category>, // null to hide
 *     results: [
 *       {
 *         name: <visible name>,
 *         bbox: [<minx>, <miny>, <maxx>, <maxy>]
 *       }
 *     ]
 *   }
 * ]
 */
WsgiSearch.prototype.parseResults = function(data, status, callback) {
  // group by category
  var categories = {};
  var category = null;
  for (var i=0; i<data.results.length; i++) {
    var result = data.results[i];
    if (result.bbox == null) {
      // add category
      category = result.displaytext;
      if (categories[category] === undefined) {
        categories[category] = [];
      }
    }
    else {
      // add result to current category
      categories[category].push({
        name: result.displaytext,
        bbox: result.bbox
      })
    }
  }

  // convert to search results
  var results = $.map(categories, function(features, category) {
    return {
      category: category,
      results: features
    };
  });
  callback(results);
};
