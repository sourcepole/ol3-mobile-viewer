/**
 * jQuery Mobile GUI
 */

var Gui = {};

// location tracking
Gui.tracking = false;
Gui.following = true;
Gui.orientation = true;

Gui.updateLayout = function() {
  // use full content height for map
  $("#map").height(window.innerHeight - $("#header ").outerHeight());

  // limit panels to screen height
  $('#panelTopics .ui-listview').height(window.innerHeight - 90);
  $('#panelLayerAll').height(window.innerHeight - 90);
  $('#panelLayerOrder .ui-listview').height(window.innerHeight - 170);
  $('#properties').height(window.innerHeight - 80);
}

// show selected panel
Gui.panelSelect = function(panel) {
  $('#panelTopics').toggle(panel === 'panelTopics');
  $('#panelLayerAll').toggle(panel === 'panelLayerAll');
  $('#panelLayerOrder').toggle(panel === 'panelLayerOrder');
}

// fill topics list
Gui.loadTopics = function(categories) {
  html = "";
  Map.topics = {};
  for (var i=0;i<categories.length; i++) {
    var category = categories[i];

    html += '<li data-role="list-provider">' + category.title + '</li>';

    for (var j=0;j<category.topics.length; j++) {
      var topic = category.topics[j];
      html +=    '<li data-topic="' + topic.name + '">';
      html +=    '  <img src="' + topic.icon + '"/>';
      html +=    '  <p style="white-space:pre-wrap">' + topic.title + '</p>';
      html +=    '</li>';

      Map.topics[topic.name] = {wms_url: topic.wms_url};
    }
  }

  $('#topicList').html(html);
  $('#topicList').listview('refresh');
}

// update layers list
Gui.loadLayers = function(groups) {
  html = "";
  var layers = [];
  for (var i=0;i<groups.length; i++) {
    var group = groups[i];

    html += '<div data-role="collapsible" data-theme="c">';
    html += '  <h3>' + group.title + '</h3>';
    html += '  <fieldset data-role="controlgroup">';

    for (var j=0;j<group.layers.length; j++) {
      var layer = group.layers[j];
      html += '<label>';
      html += '  <input type="checkbox" ';
      html += '    name="' + layer.layername + '" ';
      html += '    data-layer="' + layer.layername + '" ';
      if (layer.visini) {
        html += '    checked ';
      }
      html += '  />' + layer.toclayertitle;
      html += '</label>';

      layers.push({
        layername: layer.layername,
        wms_sort: layer.wms_sort,
        visible: layer.visini
      });
    }

    html += '  </fieldset>';
    html += '</div>';
  }

  $('#panelLayerAll').html(html);
  $('#panelLayerAll').trigger('create');

  // store layer visibilities sorted by wms_sort
  layers = layers.sort(function(a, b) {
    return a.wms_sort - b.wms_sort;
  });
  Map.layers = {};
  for (var i=0; i<layers.length; i++) {
    var layer = layers[i];
    Map.layers[layer.layername] = layer.visible;
  }

  Map.setTopicLayer();
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
  Gui.updateLayout();
  $(window).on('resize', function() {
    Gui.updateLayout();
  });

  // map
  Map.createMap();

  // layer panel navigation
  $('#buttonTopics').on('tap', function() {
    Gui.panelSelect('panelTopics');
  });
  $('#buttonLayerAll').on('tap', function() {
    Gui.panelSelect('panelLayerAll');
  });
  $('#buttonLayerOrder').on('tap', function() {
    Gui.panelSelect('panelLayerOrder');
  });

  // default properties
  $('#switchFollow').val('on');
  $('#switchFollow').slider('refresh');
  $('#switchOrientation').val('off');
  $('#switchOrientation').slider('refresh');
  $('#switchScale').val('on');
  $('#switchScale').slider('refresh');
  Map.toggleScalebar(true);

  // topics
  Topics.loadTopics("src/topics.json", Gui.loadTopics);
  // topic selection
  $('#topicList').delegate('li', 'vclick', function(e) {
    Map.topic = $(this).data('topic');
    Layers.loadLayers("src/layers/layers_" + $(this).data('topic') + ".json", Gui.loadLayers);
  });
  // layer change
  $('#panelLayerAll').delegate(':checkbox', 'change', function(e) {
    Map.setLayerVisible($(this).data('layer'), $(this).is(':checked'));
  });
  Gui.panelSelect('panelTopics');

  // compass
  $(document).on('maprotation', function(e) {
    $('#btnCompass').find('.ui-icon').css('transform', 'rotate(' + e.rotation + 'rad)');
  });
  $('#btnCompass').on('tap', function() {
    Map.setRotation(0);
  });

  // geolocation
  $('#btnLocation').on('tap', function() {
    Gui.tracking = !Gui.tracking;
    $('#btnLocation .ui-icon').toggleClass('ui-icon-location_off', !Gui.tracking);
    $('#btnLocation .ui-icon').toggleClass('ui-icon-location_on', Gui.tracking);
    Map.toggleTracking(Gui.tracking);
    Map.toggleFollowing(Gui.tracking && Gui.following);
  });

  // properties
  $('#switchFollow').on('change', function(e) {
    Gui.following = $(this).val() == 'on';
    Map.toggleFollowing(Gui.tracking && Gui.following);
  });
  $('#switchOrientation').on('change', function(e) {
    Gui.orientation = $(this).val() == 'on';
    Map.toggleOrientation(Gui.orientation);
  });
  $('#switchScale').on('change', function(e) {
    Map.toggleScalebar($(this).val() == 'on');
  });
});
