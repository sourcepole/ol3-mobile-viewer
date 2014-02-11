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
// device window orientation
Map.windowOrientation = undefined;
// OpenLayers 3 ScaleLine control
Map.scaleLine = null;
// WMS selection
Map.selection = null;
// last click position
Map.lastClickPos = null;
// click marker
Map.clickMarker = null;
// ignore clicks on map
Map.ignoreClick = false;

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
    renderers = ['canvas', 'webgl', 'dom'];
  }

  Map.map = new ol.Map({
    layers: [],
    renderer: renderers,
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
    Map.map.on('singleclick', function(e) {
      if (Map.ignoreClick) {
        return;
      }
      Map.lastClickPos = e.coordinate;
      var url = null;
      if (Config.featureInfo.useWMSGetFeatureInfo) {
        var view = Map.map.getView();
        url = Map.topicLayer.getSource().getGetFeatureInfoUrl(
          e.coordinate,
          view.getResolution(),
          view.getProjection(),
          {
            'INFO_FORMAT': Config.featureInfo.format
          }
        );
      }
      else {
        url = Config.featureInfo.url(Map.topic, e.coordinate, Map.featureInfoLayers())
      }
      $.ajax({
        url: url,
        dataType: 'text'
      }).done(function(data, status) {
        featureInfoCallback([data]);
      });
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
    serverType: Config.map.wmsServerType,
    dpi: Config.map.dpi
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
      source: new ol.source.ImageWMS(wmsOptions)
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
    extent: Config.map.extent,
    serverType: Config.map.wmsServerType,
    dpi: Config.map.dpi
  };
  Map.backgroundLayer = null;
  if (Config.map.useTiledBackgroundWMS) {
    Map.backgroundLayer = new ol.layer.Tile({
      source: new ol.source.TileWMS(wmsOptions)
    });
  }
  else {
    Map.backgroundLayer = new ol.layer.Image({
      source: new ol.source.ImageWMS(wmsOptions)
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

Map.featureInfoLayers = function() {
  // collect visible layers for current scale
  var featureInfoLayers = [];
  var currentRes = Map.map.getView().getResolution();
  for (var key in Map.layers) {
    var layer = Map.layers[key];
    if (layer.visible) {
      var visible = true;

      // check if layer is in scale range
      if (layer.minscale != undefined) {
        visible = (currentRes >= Map.scaleDenomToResolution(layer.minscale, false));
      }
      if (visible && layer.maxscale != undefined) {
        visible = (currentRes <= Map.scaleDenomToResolution(layer.maxscale, false));
      }

      if (visible) {
        featureInfoLayers.push(key);
      }
    }
  }
  return featureInfoLayers;
}

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
  var visibleLayers = Map.visibleLayers();
  if (visibleLayers.length > 0) {
    Map.mergeWmsParams({
      'LAYERS': visibleLayers.join(','),
      'OPACITIES': Map.layerOpacities().join(',')
    });
  }
  // hide map layer if there are no visible layers
  Map.topicLayer.setVisible(visibleLayers.length > 0);
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

// get resolution for a scale
// set closest to get closest view resolution
Map.scaleDenomToResolution = function(scaleDenom, closest) {
  // resolution = scaleDenom / (metersPerUnit * dotsPerMeter)
  var res = scaleDenom / (Map.map.getView().getProjection().getMetersPerUnit() * (Config.map.dpi / 0.0254));
  if (closest) {
    return Map.map.getView().constrainResolution(res);
  }
  else {
    return res;
  }
};

// set max zoom of map
Map.setMinScaleDenom = function(scaleDenom) {
  Map.minResolution = Map.scaleDenomToResolution(scaleDenom, true);
  Map.clampToScale(scaleDenom);
};

// adjust max zoom
Map.clampToScale = function(scaleDenom) {
  var minRes = Map.scaleDenomToResolution(scaleDenom, true);
  if (Map.map.getView().getResolution() < minRes) {
    Map.map.getView().setResolution(minRes);
  }
}

// zoom to extent and clamp to max zoom level
// extent as [<minx>, <miny>, <maxx>, maxy>]
Map.zoomToExtent = function(extent, minScaleDenom) {
  Map.map.getView().fitExtent(extent, Map.map.getSize());
  Map.clampToScale(minScaleDenom);
};

Map.toggleTracking = function(enabled) {
  if (Map.geolocation == null) {
    // create geolocation
    Map.geolocation = new ol.Geolocation({
      trackingOptions: {
        enableHighAccuracy: true
      }
    });
    Map.geolocation.bindTo('projection', Map.map.getView());

    Map.geolocation.on('error', function(error) {
      if (error.code == error.PERMISSION_DENIED) {
        alert(I18n.geolocation.permissionDeniedMessage);
      };
    });

    // add geolocation marker
    var marker = new ol.Overlay({
      element: ($('<div id="locationMarker"></div>')),
      positioning: 'center-center'
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

Map.setWindowOrientation = function(orientation) {
  Map.windowOrientation = orientation;
  if (Map.deviceOrientation != null && Map.deviceOrientation.getTracking() && Map.deviceOrientation.getHeading() != undefined) {
    Map.setRotation(Map.adjustedHeading(-Map.deviceOrientation.getHeading()));
  }
};

Map.adjustedHeading = function(heading) {
  if (Map.windowOrientation != undefined) {
    // include window orientation (0, 90, -90 or 180)
    heading -= Map.windowOrientation * Math.PI / 180.0;
  }
  return heading;
};

Map.toggleOrientation = function(enabled) {
  if (Map.deviceOrientation == null) {
    Map.deviceOrientation = new ol.DeviceOrientation();

    Map.deviceOrientation.on('change:heading', function(event) {
      var heading = Map.adjustedHeading(-event.target.getHeading());
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
      element: ($('<div id="clickMarker"></div>')),
      positioning: 'center-center'
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

Map.toggleClickHandler = function(enabled) {
  Map.ignoreClick = !enabled;
};
