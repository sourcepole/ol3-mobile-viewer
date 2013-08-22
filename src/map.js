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
// OpenLayers 3 map object
Map.map = null;
// OpenLayers 3 geolocation object
Map.geolocation = null;
// OpenLayers 3 DeviceOrientation object
Map.deviceOrientation = null;
// OpenLayers 3 ScaleLine control
Map.scaleLine = null;
// WMS selection
Map.selection = null;

Map.useTiledWMS = false;

Map.createMap = function(featureInfoCallback) {
  // map options
  var useCanvasRenderer = true; // FIXME: disable WEBGL renderer for now

  // browser specific map setup
  if (navigator.userAgent.match(/Mozilla.+Android.+Safari/)) {
    // Android Safari
    // Mozilla/5.0 (Linux; U; Android 4.0.3; en-gb; Transformer TF101 Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30

    // SingleImageWMS is not refreshed on pinch zoom
    Map.useTiledWMS = true;
  }
  else if (navigator.userAgent.match(/Mozilla.+Android.+Firefox/)) {
    // Android Firefox
    // Mozilla/5.0 (Android; Tablet; rv:21.0) Gecko/21.0 Firefox/21.0

    // SingleImageWMS is not refreshed on pinch zoom
    Map.useTiledWMS = true;
    // WEBGL renderer renders GL WMS as black image
    useCanvasRenderer = true;
  }

  var projection = ol.proj.configureProj4jsProjection({
    code: 'EPSG:21781',
    extent: [485869.5728, 837076.5648, 76443.1884, 299941.7864]
  });

  var wmsOptions = {
    url: 'http://wms.geo.admin.ch/',
    crossOrigin: 'anonymous',
    attributions: [new ol.Attribution(
        '&copy; ' +
        '<a href="http://www.geo.admin.ch/internet/geoportal/en/home.html">' +
        'Pixelmap 1:1000000 / geo.admin.ch</a>')],
    params: {
      'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
      'FORMAT': 'image/jpeg'
    },
    extent: [420000, 900000, 30000, 350000]
  };
  var layers = [];
  if (Map.useTiledWMS) {
    layers.push(
      new ol.layer.TileLayer({
        source: new ol.source.TiledWMS(wmsOptions)
      })
    );
  }
  else {
    layers.push(
      new ol.layer.ImageLayer({
        source: new ol.source.SingleImageWMS(wmsOptions)
      })
    );
  }

  var renderers = ol.RendererHints.createFromQueryData();
  if (useCanvasRenderer) {
    renderers = [ol.RendererHint.CANVAS, ol.RendererHint.WEBGL, ol.RendererHint.DOM];
  }

  Map.map = new ol.Map({
    layers: layers,
    renderers: renderers,
    target: 'map',
    view: new ol.View2D({
      projection: projection,
      center: [660000, 190000],
      zoom: 2
    }),
    controls:[]
  });

  Map.map.getView().on('change:rotation', function() {
    $.event.trigger({type: 'maprotation', rotation: Map.map.getView().getRotation()});
  });

  // feature info
  if (featureInfoCallback != null) {
    Map.map.on('click', function(e) {
      /* FIXME: enable this block for production
      Map.map.getFeatureInfo({
        pixel: e.getPixel(),
        success: featureInfoCallback,
      });
      */
      /* FIXME: use static xml file for demonstration purposes, to avoid cross domain issues */
      $.ajax({
        url: "src/get_feature_info_response.xml",
        dataType: 'text'
      }).done(function(data, status) {
        featureInfoCallback([data]);
      });
      /* END */
    });
  }
};

Map.setTopicLayer = function() {
  // remove old layer
  Map.map.removeLayer(Map.map.getLayers().getAt(0));

  // add new layer
  var wmsParams = {
    'LAYERS': Map.visibleLayers().join(','),
    'FORMAT': 'image/png; mode=8bit'
  };
  if (Map.selection != null) {
    wmsParams['SELECTION'] = Map.selection;
  }
  var wmsOptions = {
    url: Map.topics[Map.topic].wms_url,
    params: wmsParams,
    extent: [420000, 900000, 30000, 350000],
    getFeatureInfoOptions: {
      method: 'xhr_get',
      params: {
        INFO_FORMAT: 'text/xml'
      }
    }
  };
  var layer = null;
  if (Map.useTiledWMS) {
    layer = new ol.layer.TileLayer({
      source: new ol.source.TiledWMS(wmsOptions)
    });
  }
  else {
    layer = new ol.layer.ImageLayer({
      source: new ol.source.SingleImageWMS(wmsOptions)
    });
  }
  Map.map.addLayer(layer);
};

Map.setLayerVisible = function(layername, visible) {
  Map.layers[layername] = visible;
  Map.refresh();
};

Map.visibleLayers = function() {
  // collect visible layers
  var visibleLayers = [];
  for (var key in Map.layers) {
    if (Map.layers[key]) {
      visibleLayers.push(key);
    }
  }
  return visibleLayers;
};

// set WMS SELECTION parameter, disable if layer = null
Map.setSelection = function(layer, ids) {
  if (layer == null) {
    Map.selection = null;
  }
  else {
    Map.selection = layer + ":" + ids.join(',');
  }
  Map.refresh();
}

Map.refresh = function() {
  if (Map.topic != null) {
    // FIXME: WMS layer update (mergeNewParams()) not yet implemented, replace layer instead
    Map.setTopicLayer();
  }
}

// set map rotation in rad
Map.setRotation = function(rotation) {
  Map.map.getView().setRotation(rotation);
};

// zoom to extent and clamp to max zoom level
// extent as [<minx>, <maxx>, <miny>, maxy>]
Map.zoomToExtent = function(extent, maxZoom) {
  Map.map.getView().fitExtent(extent, Map.map.getSize())
  if (Map.map.getView().getZoom() > maxZoom) {
    Map.map.getView().setZoom(maxZoom)
  }
}

Map.toggleTracking = function(enabled) {
  if (Map.geolocation == null) {
    // create geolocation
    Map.geolocation = new ol.Geolocation();
    Map.geolocation.bindTo('projection', Map.map.getView());

    // add geolocation marker
    var marker = new ol.Overlay({
      map: Map.map,
      element: ($('<div id="locationMarker"></div>'))
    });
    marker.bindTo('position', Map.geolocation);
  }

  Map.geolocation.setTracking(enabled);
  $('#locationMarker').toggle(enabled);
}

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

Map.centerOnLocation = function() {
  Map.map.getView().setCenter(Map.geolocation.getPosition());
};

Map.toggleOrientation = function(enabled) {
  if (Map.deviceOrientation == null) {
    Map.deviceOrientation = new ol.DeviceOrientation();

    Map.deviceOrientation.on('change', function(event) {
      var heading = event.target.getHeading();
      if (Math.abs(Map.map.getView().getRotation() - heading) > 0.05) {
        Map.setRotation(heading);
      }
    });
  }

  Map.deviceOrientation.setTracking(enabled);
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
