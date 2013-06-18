function createMap() {
  var projection = ol.projection.configureProj4jsProjection({
    code: 'EPSG:21781',
    extent: new ol.Extent(485869.5728, 76443.1884, 837076.5648, 299941.7864)
  });

  var map = new ol.Map({
    layers: [
      new ol.layer.ImageLayer({
        source: new ol.source.SingleImageWMS({
          url: 'http://map.geo.gl.ch/wms/Public',
          params: {
            'LAYERS': 'Pixelkarte 25 grau,CH-Rahmen',
            FORMAT: 'image/png; mode=8bit'
          },
          extent: new ol.Extent(700000, 180000, 745000, 230000)
        })
      })
    ],
    renderers: ol.RendererHints.createFromQueryData(),
    target: 'map',
    view: new ol.View2D({
      projection: projection,
      center: [722500, 205000],
      zoom: 4
    })
  });
};

function updateLayout() {
  // use full content height for map
  $("#map").height(window.innerHeight - $("#header ").outerHeight());

  // limit panel list to screen height
  $('.ui-panel .ui-listview').height(window.innerHeight - 140);
}

// show selected panel
function panelSelect(panel) {
  $('#topics').toggle(panel === 'topics');
  $('#layers').toggle(panel === 'layers');
  $('#layerOrder').toggle(panel === 'layerOrder');
}

// load topics
function loadTopics() {
  // static dummy html
  var html = '<li data-role="list-provider">Amtliche Vermessung und Basispl&auml;ne</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="img/grundplan_av.png"/>';
  html +=    '  Grundplan Amtliche Vermessung mit Abstandslinien (schwarz/weiss)</a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="img/grundplan_av_farbig.png"/>';
  html +=    '  Grundplan Amtliche Vermessung mit Abstandslinien (farbig)</a>';
  html +=    '</li>';

  $('#topicsList').html(html);
  $('#topicsList').listview('refresh');
}

$(document).ready(function() {
  // init
  updateLayout();
  createMap();
  loadTopics();
  panelSelect('topics');

  $(window).on('resize', function() {
    updateLayout();
  });

  // layer panel navigation
  $('#topicButton').on('tap', function() {
    panelSelect('topics');
  });
  $('#layerButton').on('tap', function() {
    panelSelect('layers');
  });
  $('#layerOrderButton').on('tap', function() {
    panelSelect('layerOrder');
  });
});
