/**
 * FeatureInfo
 *
 * parse WMS GetFeatureInfo results
 * Implementation for QGIS Server XML query results
 */

var FeatureInfo = {};

// callback with GetFeatureInfo result features
FeatureInfo.callback = null;

FeatureInfo.setCallback = function(callback) {
  FeatureInfo.callback = callback;
}

/**
 * parse contents of GetFeatureInfo results and invoke the callback
 *
 * [
 *   {
 *     layer: <layername>,
 *     features: [
 *       {
 *         id: <feature id or null for rasters>,
 *         attributes: [
 *           name: <name>,
 *           value: <value>
 *         ]
 *       }
 *     ]
 *   }
 * ]
 */
FeatureInfo.parseResults = function(featureInfos) {
  var results = [];
  for (var i=0; i<featureInfos.length; i++) {
    var xml = $.parseXML(featureInfos[i]);
    $(xml).find('Layer').each(function() {
      var features = [];
      if ($(this).find('Feature').length > 0) {
        // vector features
        $(this).find('Feature').each(function() {
          var attributes = [];
          $(this).find('Attribute').each(function() {
            // filter geometry
            if ($(this).attr('name') != 'geometry') {
              attributes.push({
                name: $(this).attr('name'),
                value: $(this).attr('value')
              });
            }
          });
          features.push({
            id: $(this).attr('id'),
            attributes: attributes
          });
        });
      }
      else if ($(this).find('Attribute').length > 0) {
        // raster layer
        var attributes = [];
        $(this).find('Attribute').each(function() {
          attributes.push({
            name: $(this).attr('name'),
            value: $(this).attr('value')
          });
        });
        features.push({
          id: null,
          attributes: attributes
        });
      }

      if (features.length > 0) {
        results.push({
          layer: $(this).attr('name'),
          features: features
        });
      }
    });
  }

  FeatureInfo.callback(results);
}
