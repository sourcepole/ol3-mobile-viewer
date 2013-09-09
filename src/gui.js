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
  $('#panelFeatureInfo #featureInfoResults').height(window.innerHeight - 80);
  $('#panelSearch .ui-listview').height(window.innerHeight - 170);
  $('#properties').height(window.innerHeight - 80);
}

// show selected panel
Gui.panelSelect = function(panel) {
  $('#panelTopics').toggle(panel === 'panelTopics');
  $('#panelLayerAll').toggle(panel === 'panelLayerAll');
  $('#panelLayerOrder').toggle(panel === 'panelLayerOrder');
  // mark panel button
  $('#buttonTopics').toggleClass('selected', panel === 'panelTopics');
  $('#buttonLayerAll').toggleClass('selected', panel === 'panelLayerAll');
  $('#buttonLayerOrder').toggleClass('selected', panel === 'panelLayerOrder');
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
      html +=    '<li class="topic" data-topic="' + topic.name + '">';
      html +=    '  <img src="' + topic.icon + '"/>';
      html +=    '  <p style="white-space:pre-wrap">' + topic.title + '</p>';
      html +=    '</li>';

      Map.topics[topic.name] = {wms_url: topic.wms_url};
    }
  }

  $('#topicList').html(html);
  $('#topicList').listview('refresh');

  // select initial topic
  Gui.selectTopic('geo_admin_pk');
}

Gui.selectTopic = function(topic) {
  Map.topic = topic;
  Layers.loadLayers("src/layers/layers_" + topic + ".json", Gui.loadLayers);
  // mark topic button
  $('#topicList li.topic').removeClass('selected')
  $('#topicList li.topic[data-topic=' + topic + ']').addClass('selected');
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

// show feature info results
Gui.showFeatureInfoResults = function(results) {
  html = "";
  for (var i=0;i<results.length; i++) {
    var result = results[i];

    html += '<div data-role="collapsible"  data-collapsed="false" data-theme="c">';
    html += '  <h3>' + result.layer + '</h3>';

    for (var j=0; j<result.features.length; j++) {
      var feature = result.features[j];
      var title = feature.id === null ? "Rasterzelle" : "Feature mit ID:" + feature.id;

      html += '<div data-role="collapsible"  data-collapsed="false" data-theme="c">';
      html += '  <h3>' + title + '</h3>';
      html += '  <ul data-role="listview">'

      for (var k=0; k<feature.attributes.length; k++) {
        var attribute = feature.attributes[k];

        html += '  <li>';
        html += '    <span class="name">' + attribute.name + ': </span>';
        html += '    <span class="value">' + attribute.value + '</span>';
        html += '  </li>';
      }

      html += '  </ul>'
      html += '</div>';
    }

    html += '</div>';
  }
  if (results.length == 0) {
    html = "Kein Objekt gefunden";
  }

  $('#featureInfoResults').html(html);
  $('#featureInfoResults').trigger('create');

  $('#panelFeatureInfo').panel('open');

  Map.toggleClickMarker(true);
}

// show search results list
Gui.showSearchResults = function(results) {
  html = "";
  for (var i=0;i<results.length; i++) {
    var result = results[i];

    if (result.bbox != null) {
      html += '<li data-bbox="' + result.bbox.join(',') + '">';
    }
    else {
      html += '<li>';
    }
    html += '  <a href="#">' + result.name + '</a>';
    html += '</li>';
  }

  $('#searchResultsList').html(html);
  $('#searchResultsList').listview('refresh');

  $('#searchResults').show();

  // automatically jump to single result
  if (results.length === 1 && results[0].bbox != null) {
    Gui.jumpToSearchResult(results[0].bbox);
  }
}

// bbox as [<minx>, <maxx>, <miny>, maxy>]
Gui.jumpToSearchResult = function(bbox) {
  Map.zoomToExtent(bbox, 13);

  // disable following
  $('#switchFollow').val('off');
  $('#switchFollow').slider('refresh');
  Map.toggleFollowing(false);

  $('#panelSearch').panel('close');
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
  UrlParams.parse();

  Gui.updateLayout();
  $(window).on('resize', function() {
    Gui.updateLayout();
  });

  // map
  Map.createMap(FeatureInfo.parseResults);

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
  $('#topicList').delegate('li.topic', 'vclick', function(e) {
    Gui.selectTopic($(this).data('topic'));
    $('#panelLayer').panel('close');
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

  // feature info
  FeatureInfo.setCallback(Gui.showFeatureInfoResults);

  $('#panelFeatureInfo').on('panelclose', function() {
    Map.toggleClickMarker(false);
  });

  // search
  $('#searchInput').bind('change', function(e) {
    // reset search panel
    $('#searchResults').hide();

    var searchString = $(this).val();
    if (searchString != "") {
      // submit search
      Search.submit(searchString, Gui.showSearchResults)
    }
    else {
      // reset selection
      Map.setSelection(null, []);
    }
  });
  $('#searchResultsList').delegate('li', 'vclick', function() {
    if ($(this).data('bbox') != null) {
      var bbox = $.map($(this).data('bbox').split(','), function(value, index) {
        return parseFloat(value);
      });
      Gui.jumpToSearchResult(bbox);
    }
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

  // about popup
  $('#aboutContent').html("Text");

  // SVG fallback test
  $('span.ui-icon-layers').replaceWith(
    '<svg width="32" height="32" style="margin: 4px;">' +
    '  <image xlink:href="img/layers.svg" src="img/layers.png" width="32" height="32" style="margin: 4px;"/>' +
    '</svg>');
});
