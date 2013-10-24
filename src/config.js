/**
 * Custom configuration
 */

Config = {};

// flag to activate debug code
Config.debug = false;

// data configuration
Config.data = {};

Config.data.topicsUrl = "data/topics.json";

Config.data.layersUrl = function(topicName) {
  return "data/layers/layers_" + topicName + ".json";
}

Config.data.initialTopic = "geo_admin_pk";

// feature info
Config.featureInfo = {};

// feature info format ('text/xml' or 'text/html')
Config.featureInfo.format = 'text/xml';

// enable this to use WMS GetFeatureInfo requests
Config.featureInfo.useWMSGetFeatureInfo = false;

/**
 * custom feature info URL when not using WMS GetFeatureInfo
 *
 * topicName: current topic
 * coordinate: clicked position as [x, y]
 * layers: array of visible WMS layer names
 */
Config.featureInfo.url = function(topicName, coordinate, layers) {
  // DEBUG: sample static files for demonstration purposes
  if (Config.featureInfo.format === 'text/xml') {
    // sample QGIS Server XML query results
    return "data/get_feature_info_response.xml";
  }
  else {
    // sample HTML results
    return "data/get_feature_info_response.html";
  }
}

/* Configuration for Mapfish Appserver:
Config.featureInfo.format = 'text/html';
Config.featureInfo.useWMSGetFeatureInfo = false;
Config.featureInfo.url = function(topicName, coordinate, layers) {
  return "/topics/query?" + $.param({
    bbox: [coordinate[0], coordinate[1], coordinate[0], coordinate[1]].join(','),
    infoQuery: '{"queryTopics":["topic":"' + topicName + '","divCls":"legmain","layers":"' + layers.join(',') + '"}]}',
    mobile: 1
  });
}
// add styles for feature info results HTML to custom.css
*/

// map configuration
Config.map = {};

// ol.Extent
Config.map.extent = [420000, 900000, 30000, 350000];

// ol.View2DOptions
Config.map.viewOptions = {
  projection: ol.proj.configureProj4jsProjection({
    code: 'EPSG:21781',
    extent: Config.map.extent
  }),
  center: [660000, 190000],
  zoom: 2
};

Config.map.wmsParams = {
  'FORMAT': 'image/png; mode=8bit',
  'TRANSPARENT': null
};

Config.map.useTiledBackgroundWMS = true;
