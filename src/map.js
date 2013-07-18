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
// current map rotation
Map.rotation = null;

Map.useTiledWMS = false;

Map.createMap = function() {
  // map options
  var useCanvasRenderer = false;

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

  var projection = ol.projection.configureProj4jsProjection({
    code: 'EPSG:21781',
    extent: new ol.Extent(485869.5728, 76443.1884, 837076.5648, 299941.7864)
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
    extent: new ol.Extent(420000, 30000, 900000, 350000)
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
    controls:[
      new ol.control.Attribution()
    ]
  });

  Map.map.on('postrender', function() {
    // trigger maprotation event on rotation change
    var rotation = Map.map.getView().getRotation();
    if (rotation != Map.rotation) {
      Map.rotation = rotation;
      $.event.trigger({type: 'maprotation', rotation: rotation});
    }
  });
};

Map.setTopicLayer = function() {
  // remove old layer
  Map.map.removeLayer(Map.map.getLayers().getAt(0));

  // add new layer
  var wmsOptions = {
    url: Map.topics[Map.topic].wms_url,
    params: {
      'LAYERS': Map.visibleLayers().join(','),
      'FORMAT': 'image/png; mode=8bit'
    },
    extent: new ol.Extent(420000, 30000, 900000, 350000)
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

  // FIXME: WMS layer update (mergeNewParams()) not yet implemented, replace layer instead
  Map.setTopicLayer();
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

// set map rotation in rad
Map.setRotation = function(rotation) {
  Map.map.getView().setRotation(rotation);
};
