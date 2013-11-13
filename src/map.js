/**
 * OpenLayers 3 map
 *
 * events:
 *   maprotation({rotation: <rad>})
 */

var Map = {};

// topics (key = topic name)
Map.topics = {};
// current topic
Map.topic = null;
// ordered layers (key = layer name)
Map.layers = {};
// current background topic
Map.backgroundTopic = null;
// current background WMS layers
Map.backgroundLayers = null;
// OpenLayers 3 map object
Map.map = null;
// min resolution to limit max zoom
Map.minResolution = null;
// OpenLayers 3 layer objects
Map.topicLayer = null;
Map.backgroundLayer = null;
// OpenLayers 3 geolocation object
Map.geolocation = null;
// OpenLayers 3 DeviceOrientation object
Map.deviceOrientation = null;
// OpenLayers 3 ScaleLine control
Map.scaleLine = null;
// WMS selection
Map.selection = null;
// last click position
Map.lastClickPos = null;
// click marker
Map.clickMarker = null;

Map.useTiledWMS = false;

Map.createMap = function(featureInfoCallback) {
  // map options
  var useCanvasRenderer = true; // FIXME: disable WEBGL renderer for now

  // override from URL params
  if (UrlParams.params.tiledWms != undefined) {
    Map.useTiledWMS = UrlParams.params.tiledWms == 1;
  }

  var renderers = ol.RendererHints.createFromQueryData();
  if (useCanvasRenderer) {
    renderers = [ol.RendererHint.CANVAS, ol.RendererHint.WEBGL, ol.RendererHint.DOM];
  }

  Map.map = new ol.Map({
    layers: [],
    renderers: renderers,
    target: 'map',
    view: new ol.View2D(Config.map.viewOptions),
    controls:[]
  });

  Map.map.getView().on('change:rotation', function() {
    $.event.trigger({type: 'maprotation', rotation: Map.map.getView().getRotation()});
  });

  Map.setMinScaleDenom(Config.map.minScaleDenom.map);
  Map.map.getView().on('change:resolution', function() {
    // limit max zoom
    if (Map.map.getView().getResolution() < Map.minResolution) {
      Map.map.getView().setResolution(Map.minResolution);
    }
  });

  // feature info
  if (featureInfoCallback != null) {
    var clickTimeout = null;
    Map.map.on('click', function(e) {
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(function() {
        Map.lastClickPos = e.getCoordinate();
        if (Config.featureInfo.useWMSGetFeatureInfo) {
          Map.map.getFeatureInfo({
            pixel: e.getPixel(),
            success: featureInfoCallback
          });
        }
        else {
          $.ajax({
            url: Config.featureInfo.url(Map.topic, e.getCoordinate(), Map.visibleLayers()),
            dataType: 'text'
          }).done(function(data, status) {
            featureInfoCallback([data]);
          });
        }
      }, 200);
    });
    Map.map.on('dblclick', function(e) {
      // abort feature info on double click
      clearTimeout(clickTimeout);
    });
  }
};

Map.clearLayers = function() {
  Map.map.getLayers().clear();
  Map.topicLayer = null;
  Map.backgroundLayer = null;
  Map.backgroundTopic = null;
  Map.backgroundLayers = null;  
}

Map.setTopicLayer = function() {
  // add new layer
  var wmsParams = $.extend({}, Config.map.wmsParams, {
    'LAYERS': Map.visibleLayers().join(','),
    'OPACITIES': null
  });
  if (Map.backgroundTopic) {
    // use transparent layer with background
    wmsParams['TRANSPARENT'] = true;
  }
  if (Map.selection != null) {
    wmsParams['SELECTION'] = Map.selection;
  }
  var wmsOptions = {
    url: Map.topics[Map.topic].wms_url,
    params: wmsParams,
    extent: Config.map.extent,
    getFeatureInfoOptions: {
      method: 'xhr_get',
      params: {
        INFO_FORMAT: Config.featureInfo.format
      }
    }
  };
  Map.topicLayer = null;
  if (Map.useTiledWMS) {
    Map.topicLayer = new ol.layer.Tile({
      source: new ol.source.TileWMS(wmsOptions)
    });
  }
  else {
    wmsOptions['ratio'] = 1;
    Map.topicLayer = new ol.layer.Image({
      source: new ol.source.SingleImageWMS(wmsOptions)
    });
  }
  Map.topicLayer.name = 'topic';

  Map.map.addLayer(Map.topicLayer);
};

Map.setBackgroundLayer = function() {
  var wmsParams = $.extend({}, Config.map.wmsParams, {
    'LAYERS': Map.backgroundLayers
  });
  var wmsOptions = {
    url: Map.topics[Map.backgroundTopic].wms_url,
    params: wmsParams,
    extent: Config.map.extent
  };
  Map.backgroundLayer = null;
  if (Config.map.useTiledBackgroundWMS) {
    Map.backgroundLayer = new ol.layer.Tile({
      source: new ol.source.TileWMS(wmsOptions)
    });
  }
  else {
    Map.backgroundLayer = new ol.layer.Image({
      source: new ol.source.SingleImageWMS(wmsOptions)
    });
  }
  Map.backgroundLayer.name = 'background';

  // add background as base layer
  Map.map.getLayers().insertAt(0, Map.backgroundLayer);
}

Map.setLayerVisible = function(layername, visible, updateMap) {
  Map.layers[layername].visible = visible;
  if (updateMap) {
    Map.mergeWmsParams({
      'LAYERS': Map.visibleLayers().join(',')
    });
  }
};

Map.visibleLayers = function() {
  // collect visible layers
  var visibleLayers = [];
  for (var key in Map.layers) {
    if (Map.layers[key].visible) {
      visibleLayers.push(key);
    }
  }
  return visibleLayers;
};

// transparency between 0 and 100
Map.setLayerTransparency = function(layername, transparency, updateMap) {
  Map.layers[layername].transparency = transparency;
  if (updateMap) {
    Map.mergeWmsParams({
      'OPACITIES': Map.layerOpacities().join(',')
    });
  }
}

Map.layerOpacities = function() {
  var layerOpacities = [];
  for (var key in Map.layers) {
    if (Map.layers[key].visible) {
      // scale transparency[0..100] to opacity[255..0]
      var opacity = Math.round((100 - Map.layers[key].transparency) / 100 * 255);
      layerOpacities.push(opacity);
    }
  }
  return layerOpacities;
}

Map.refresh = function() {
  Map.mergeWmsParams({
    'LAYERS': Map.visibleLayers().join(','),
    'OPACITIES': Map.layerOpacities().join(',')
  });
}

// set WMS SELECTION parameter, disable if layer = null
Map.setSelection = function(layer, ids) {
  if (layer == null) {
    Map.selection = null;
  }
  else {
    Map.selection = layer + ":" + ids.join(',');
  }
  Map.mergeWmsParams({
    'SELECTION': Map.selection
  });
};

Map.mergeWmsParams = function(params) {
  var source = Map.topicLayer.getSource();
  var newParams = $.extend({}, source.getParams(), params);
  source.updateParams(newParams);
};

// set map rotation in rad
Map.setRotation = function(rotation) {
  Map.map.getView().setRotation(rotation);
};

// get closest resolution for a scale
Map.scaleDenomToResolution = function(scaleDenom) {
  // resolution = scaleDenom / (metersPerUnit * dotsPerMeter)
  var res = scaleDenom / (Map.map.getView().getProjection().getMetersPerUnit() * (Config.map.dpi / 0.0254));
  return Map.map.getView().constrainResolution(res);
};

// set max zoom of map
Map.setMinScaleDenom = function(scaleDenom) {
  Map.minResolution = Map.scaleDenomToResolution(scaleDenom);
  Map.clampToScale(scaleDenom);
};

// adjust max zoom
Map.clampToScale = function(scaleDenom) {
  var minRes = Map.scaleDenomToResolution(scaleDenom);
  if (Map.map.getView().getResolution() < minRes) {
    Map.map.getView().setResolution(minRes);
  }
}

// zoom to extent and clamp to max zoom level
// extent as [<minx>, <maxx>, <miny>, maxy>]
Map.zoomToExtent = function(extent, minScaleDenom) {
  Map.map.getView().fitExtent(extent, Map.map.getSize());
  Map.clampToScale(minScaleDenom);
};

Map.toggleTracking = function(enabled) {
  if (Map.geolocation == null) {
    // create geolocation
    Map.geolocation = new ol.Geolocation();
    Map.geolocation.bindTo('projection', Map.map.getView());

    // add geolocation marker
    var marker = new ol.Overlay({
      element: ($('<div id="locationMarker"></div>'))
    });
    Map.map.addOverlay(marker);
    marker.bindTo('position', Map.geolocation);
  }

  Map.geolocation.setTracking(enabled);
  $('#locationMarker').toggle(enabled);

  if (enabled) {
    // always jump to first geolocation
    Map.geolocation.on('change:position', Map.initialCenterOnLocation);
  }
};

Map.toggleFollowing = function(enabled) {
  if (Map.geolocation != null) {
    if (enabled) {
      Map.geolocation.on('change:position', Map.centerOnLocation);
    }
    else {
      Map.geolocation.un('change:position', Map.centerOnLocation);
    }
  }
};

Map.initialCenterOnLocation = function() {
  Map.centerOnLocation();
  // disable after first update
  Map.geolocation.un('change:position', Map.initialCenterOnLocation);
};

Map.centerOnLocation = function() {
  Map.map.getView().setCenter(Map.geolocation.getPosition());
  Map.clampToScale(Config.map.minScaleDenom.geolocation);
};

Map.toggleOrientation = function(enabled) {
  if (Map.deviceOrientation == null) {
    Map.deviceOrientation = new ol.DeviceOrientation();

    Map.deviceOrientation.on('change', function(event) {
      var heading = -event.target.getHeading();
      if (Math.abs(Map.map.getView().getRotation() - heading) > 0.0175) {
        Map.setRotation(heading);
      }
    });
  }

  Map.deviceOrientation.setTracking(enabled);
};

Map.toggleClickMarker = function(enabled) {
  if (Map.clickMarker == null) {
    Map.clickMarker = new ol.Overlay({
      element: ($('<div id="clickMarker"></div>'))
    });
    Map.map.addOverlay(Map.clickMarker);
  }
  Map.clickMarker.setPosition(enabled ? Map.lastClickPos : undefined);
};

Map.toggleScalebar = function(enabled) {
  if (Map.scaleLine == null) {
    Map.scaleLine = new ol.control.ScaleLine({
      units: 'metric',
    });
  }
  if (enabled && Map.scaleLine.getMap() == null) {
    Map.map.addControl(Map.scaleLine);
  }
  else {
    Map.map.removeControl(Map.scaleLine);
  }
};
