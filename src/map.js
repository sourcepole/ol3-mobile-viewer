/**
 * OpenLayers 3 map
 */

function createMap() {
  // map options
  var useTiledWMS = false;
  var useCanvasRenderer = false;

  // browser specific map setup
  if (navigator.userAgent.match(/Mozilla.+Android.+Safari/)) {
    // Android Safari
    // Mozilla/5.0 (Linux; U; Android 4.0.3; en-gb; Transformer TF101 Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30

    // SingleImageWMS is not refreshed on pinch zoom
    useTiledWMS = true;
  }
  else if (navigator.userAgent.match(/Mozilla.+Android.+Firefox/)) {
    // Android Firefox
    // Mozilla/5.0 (Android; Tablet; rv:21.0) Gecko/21.0 Firefox/21.0

    // SingleImageWMS is not refreshed on pinch zoom
    useTiledWMS = true;
    // WEBGL renderer renders GL WMS as black image
    useCanvasRenderer = true;
  }

  var projection = ol.projection.configureProj4jsProjection({
    code: 'EPSG:21781',
    extent: new ol.Extent(485869.5728, 76443.1884, 837076.5648, 299941.7864)
  });

  var layers = [];
  if (useTiledWMS) {
    layers.push(
      new ol.layer.TileLayer({
        source: new ol.source.TiledWMS({
          url: 'http://map.geo.gl.ch/wms/Public',
          params: {
            'LAYERS': 'Pixelkarte 25 grau,CH-Rahmen',
            'FORMAT': 'image/png; mode=8bit'
          },
          extent: new ol.Extent(700000, 180000, 745000, 230000)
        })
      })
    );
  }
  else {
    layers.push(
      new ol.layer.ImageLayer({
        source: new ol.source.SingleImageWMS({
          url: 'http://map.geo.gl.ch/wms/Public',
          params: {
            'LAYERS': 'Pixelkarte 25 grau,CH-Rahmen',
            'FORMAT': 'image/png; mode=8bit'
          },
          extent: new ol.Extent(700000, 180000, 745000, 230000)
        })
      })
    );
  }

  var renderers = ol.RendererHints.createFromQueryData();
  if (useCanvasRenderer) {
    renderers = [ol.RendererHint.CANVAS, ol.RendererHint.WEBGL, ol.RendererHint.DOM];
  }

  var map = new ol.Map({
    layers: layers,
    renderers: renderers,
    target: 'map',
    view: new ol.View2D({
      projection: projection,
      center: [722500, 205000],
      zoom: 4
    }),
    controls:[]
  });
};
