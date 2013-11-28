/**
 * Custom configuration
 */

Config = {};

// flag to activate debug code
Config.debug = false;


// GUI
Config.gui = {
  hideShareButton: false,
  hideLoginButton: false
};


// data configuration
Config.data = {};

Config.data.topicsUrl = "data/topics.json";

Config.data.layersUrl = function(topicName) {
  return "data/layers/layers_" + topicName + ".json";
}

Config.data.initialTopic = "geo_admin_pk";


// default properties
Config.defaultProperties = {
  following: true,
  orientation: false,
  scalebar: true
};


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
    infoQuery: '{"queryTopics":[{"topic":"' + topicName + '","divCls":"legmain","layers":"' + layers.join(',') + '"}]}',
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

// DPI for scale calculations
Config.map.dpi = 96;

// limit max zoom to this scale (e.g. minScaleDenom=500 for 1:500)
Config.map.minScaleDenom = {
  map: 1000, // if topic.minscale is not set
  geolocation: 10000, // on location following
  search: 10000 // jump to search results
};


// search configuration

/**
 * SwissSearch
 *
 * services: SwissSearch services
 * queryPostfix: append this to the query string to limit search results e.g. to a canton ("ZH")
 */
Config.search = new SwissSearch('swissnames', "");


/**
 * Mapfish Appserver search
 */

// create query URL from search params
Config.mapfishUrl = function(searchParams) {
  // DEBUG: sample static file for demonstration purposes
  return "data/mapfish_search_response.json";
/*
  return "/search/fullsearch.json?" + $.param({
    begriff: searchParams
  });
*/
};

// return feature name and bbox=[<minx>, <maxx>, <miny>, maxy>]
Config.mapfishParseFeature = function(feature) {
  return {
    name: feature.begriff,
    bbox: [feature.bbox_xmin, feature.bbox_xmax, feature.bbox_ymin, feature.bbox_ymax]
  };
};

//Config.search = new MapfishSearch(Config.mapfishUrl, Config.mapfishParseFeature);
