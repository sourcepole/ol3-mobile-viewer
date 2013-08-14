/**
 * Search
 */

var Search = {};

// query url
Search.url = "src/get_feature_info_response.xml"; // FIXME: use hardcoded result for now

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
    dataType: 'xml'
  });

  request.done(Search.parseResults);

  request.fail(function(jqXHR, status) {
    alert("Suche fehlgeschlagen:\n" + jqXHR.status + ": " + jqXHR.statusText);
  });
}

/**
 * parse search parameters and return URL parameters as hash
 */
Search.parseSearchParams = function(searchParams) {
  // TODO: parse search string
  searchParams = $.trim(searchParams);

  return {};
}

/**
 * parse query result and invoke the callback
 *
 * {
 *   layer: <WMS layer>,
 *   features: [
 *     {
 *       id: <featureId>,
 *       name: <visible name>,
 *       bbox: [<minx>, <maxx>, <miny>, maxy>]
 *     }
 *   ],
 * }
 */
Search.parseResults = function(data, status) {
  var results = {
    features: []
  };
  $(data).find('Layer').each(function(){
    results.layer = $(this).attr('name');
  });
  $(data).find('Feature').each(function(){
    var result = {
      id: $(this).attr('id')
    };

    var street = {};
    $(this).find('Attribute').each(function(){
      if ($(this).attr('name') === "Strassenname") {
        street.name = $(this).attr('value');
      }
      else if ($(this).attr('name') === "Hausnummer") {
        street.number = $(this).attr('value');
      }
    });
    result.name = street.name + " " + street.number;

    $(this).find('BoundingBox').each(function(){
      result.bbox = [$(this).attr('minx'), $(this).attr('maxx'), $(this).attr('miny'), $(this).attr('maxy')]
    });

    results.features.push(result);
  });

  Search.callback(results);
}

/*
  http://map.geo.gl.ch/wms/Public?&_dc=1376388098952&query=adresse&gb_kreis=1609&strasse=bahnhofstrasse&nummer=

        data: {
          'SERVICE': 'WMS',
          'VERSION': '1.1.1',
          'REQUEST': 'GetFeatureInfo',
          'LAYERS': this.queryLayer,
          'QUERY_LAYERS': this.queryLayer,
          'FEATURE_COUNT': 10,
          'INFO_FORMAT': 'text/xml',
          'SRS': 'EPSG:' + epsgcode,
          'FILTER': filter
        },
*/

/*
TODO: custom search
- url
- parse searchParams -> url params
- done -> parse data
- callback
  - name -> resultsList
  - id -> WMS SELECTION
  - bbox -> jumpto
*/


// TODO: parse  "Glarus Bahnhofstrasse 12"

// TODO: lookup place
  // ort /^(\w+)\s*/
  // strasse  /\s+(\D+)/
  // nummer /(\d+)$/

