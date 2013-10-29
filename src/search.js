/**
 * Search
 *
 * use GeoAdmin SwissSearch geocoding
 * http://api.geo.admin.ch/main/wsgi/doc/build/services/sdiservices.html
 */

var Search = {};

// query url
Search.url = "https://api.geo.admin.ch/swisssearch/geocoding";

// append query postfix to limit search results
Search.queryPostfix = Config.search.queryPostfix;

// callback with search result features
Search.callback = null;

/**
 * submit search query
 */
Search.submit = function(searchParams, callback) {
  Search.callback = callback;

  var request = $.ajax({
    url: Search.url,
    data: Search.parseSearchParams(searchParams),
    dataType: 'jsonp',
    jsonp: 'cb'
  });

  request.done(Search.parseResults);

  request.fail(function(jqXHR, status) {
    alert(I18n.search.failed + "\n" + jqXHR.status + ": " + jqXHR.statusText);
  });
}

/**
 * parse search parameters and return URL parameters as hash
 */
Search.parseSearchParams = function(searchParams) {
  // append query postfix
  var query = $.trim(searchParams) + " " + Search.queryPostfix;
  return {
    services: 'swissnames', // FIXME: use 'address' if available
    query: query
  };
}

/**
 * parse query result and invoke the callback
 *
 * [
 *   {
 *     name: <visible name>,
 *     bbox: [<minx>, <maxx>, <miny>, maxy>]
 *   }
 * ]
 */
Search.parseResults = function(data, status) {
  var results = $.map(data.results, function(value, index) {
    // remove HTML tags and (<canton>)
    var name = value.label.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s\([A-Z]{2}\)/, "");

    // reorder bbox coords
    var bbox = [value.bbox[0], value.bbox[2], value.bbox[1], value.bbox[3]];

    return {
      name: name,
      bbox: bbox
    }
  });

  Search.callback(results);
}
