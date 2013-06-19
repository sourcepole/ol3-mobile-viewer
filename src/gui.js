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
    }),
	controls:[]
  });
};

function updateLayout() {
  // use full content height for map
  $("#map").height(window.innerHeight - $("#header ").outerHeight());

  // limit panel list to screen height
  $('.ui-panel .ui-listview').height(window.innerHeight - 160);
  $('#panelProperties').height(window.innerHeight - 160);
}

// show selected panel
function panelSelect(panel) {
  $('#panelTopics').toggle(panel === 'panelTopics');
  $('#panelLayerAll').toggle(panel === 'panelLayerAll');
  $('#panelLayerOrder').toggle(panel === 'panelLayerOrder');
}

// load topics
function loadTopics() {
  // static dummy html
  var html = '<li data-role="list-provider">Amtliche Vermessung und Basispl&auml;ng</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="img/grundplan_av.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Grundplan Amtliche Vermessung mit Abstandslinien (schwarz/weiss)</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="img/grundplan_av_farbig.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Grundplan Amtliche Vermessung mit Abstandslinien (farbig)</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/orthofotos_und_uep.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Orthofotos und &Uuml;bersichtspl&auml;ne (inkl. historische)</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/administrative_grenzen.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Admistrative Grenzen (Quartiere, Postkreise, Zivilgemeinden)</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/grundplan_av_mit_eigentum.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Grundplan Amtliche Vermessung mit Eigentum (schwarz/weiss)</p></a>';
  html +=    '</li>';
  html +=    '<li data-role="list-provider">Raumplanung</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/zonenplan.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Zonenplan</p></a>';
  html +=    '</li>';
  html +=    '<li data-role="list-provider">Hydrologie und Grundwasser</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/gewaesserplan.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Gew&auml;sserplan</p></a>';
  html +=    '</li>';
  html +=    '<li data-role="list-provider">Infrastruktur</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/abfallentsorgung.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Abfallentsorgung</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/wc_anlagen.png"/>';
  html +=    '  <p style="white-space:pre-wrap">&Ouml;ffentliche WC-Anlagen</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/baustellen_oeffentlich.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Aktuelle Baustellen</p></a>';
  html +=    '</li>';
  html +=    '<li><a href="#">';
  html +=    '  <img src="http://webgis.uster.ch/qgis-web-client/thumbnails/baukoordination.png"/>';
  html +=    '  <p style="white-space:pre-wrap">Baukoordination (Baustellen)</p></a>';
  html +=    '</li>';

  $('#topicList').html(html);
  $('#topicList').listview('refresh');
}

// binds the reorder functionality to the visible layer list
$(document).bind('pageinit', function() {
  $('#listOrder').sortable();
  $('#listOrder').disableSelection();
  $('#listOrder').bind('sortstop', function(event, ui) {
    $('#listOrder').listview('refresh');
	});
});


$(document).ready(function(e) {
  // init
  updateLayout();
  createMap();
  loadTopics();
  panelSelect('panelTopics');

  $(window).on('resize', function() {
    updateLayout();
  });

  // layer panel navigation
  $('#buttonTopics').on('tap', function() {
    panelSelect('panelTopics');
  });
  $('#buttonLayerAll').on('tap', function() {
    panelSelect('panelLayerAll');
  });
  $('#buttonLayerOrder').on('tap', function() {
    panelSelect('panelLayerOrder');
  });
  
  // set default value for map following
  $('#switchFollow').val('on');
  $('#switchFollow').slider('refresh');
  
});
