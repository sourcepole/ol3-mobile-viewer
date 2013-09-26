/**
 * Custom configuration
 */

Config = {};

// flag to activate debug code
Config.debug = true;

// data configuration
Config.data = {};

Config.data.topicsUrl = "data/topics.json";

Config.data.layersUrl = function(topicName) {
  return "data/layers/layers_" + topicName + ".json";
}


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
  'FORMAT': 'image/png; mode=8bit'
};

// TODO: translations
