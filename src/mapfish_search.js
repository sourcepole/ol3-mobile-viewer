/**
 * Mapfish Appserver search
 */

function MapfishSearch(urlCallback, parseFeatureCallback) {
  // create query URL from search params
  this.urlCallback = urlCallback;

  // get feature name and bbox
  this.parseFeatureCallback = parseFeatureCallback;
};

// inherit from Search
MapfishSearch.prototype = new Search();

/**
 * submit search query
 */
MapfishSearch.prototype.submit = function(searchParams, callback) {
  var request = $.ajax({
    url: this.urlCallback(searchParams),
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
 *     name: <visible name>,
 *     bbox: [<minx>, <maxx>, <miny>, maxy>]
 *   }
 * ]
 */
MapfishSearch.prototype.parseResults = function(data, status, callback) {
  // workaround for missing scope inside $.map
  var parseFeatureCallback = this.parseFeatureCallback;
  var results = $.map(data.features, function(feature, index) {
    return parseFeatureCallback(feature);
  });

  callback(results);
};
