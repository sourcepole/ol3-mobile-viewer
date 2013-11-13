/**
 * jQuery Mobile GUI
 */

var Gui = {};

// location tracking
Gui.tracking = false;
Gui.following = true;
Gui.orientation = true;

// currently selected layer in layer order panel
Gui.selectedLayer = null;

Gui.updateLayout = function() {
  // use full content height for map
  $('#map').height(window.innerHeight);

  // limit panels to screen height
  $('#panelTopics .ui-listview').height(window.innerHeight - 90);
  $('#panelLayerAll').height(window.innerHeight - 90);
  $('#panelLayerOrder .ui-listview').height(window.innerHeight - 200);
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

      if (topic.main_layer != false) {
        html +=    '<li class="topic" data-topic="' + topic.name + '">';
        html +=    '  <img src="' + topic.icon + '"/>';
        html +=    '  <p style="white-space:pre-wrap">' + topic.title + '</p>';
        html +=    '</li>';
      }

      Map.topics[topic.name] = {
        wms_url: topic.wms_url,
        minscale: topic.minscale,
        bg_topic: topic.bg_topic
      };
    }
  }

  $('#topicList').html(html);
  $('#topicList').listview('refresh');

  // select initial topic
  Gui.selectTopic(Config.data.initialTopic);
}

Gui.selectTopic = function(topic) {
  Map.clearLayers();
  Map.topic = topic;
  Map.setMinScaleDenom(Map.topics[Map.topic].minscale || Config.map.minScaleDenom.map);
  Map.backgroundTopic = Map.topics[Map.topic].bg_topic || null;
  Layers.loadLayers(Config.data.layersUrl(topic), Gui.loadLayers);
  if (Map.backgroundTopic) {
    // load background layers
    Layers.loadLayers(Config.data.layersUrl(Map.backgroundTopic), Gui.loadBackgroundLayers);
  }

  // mark topic button
  $('#topicList li.topic').removeClass('selected')
  $('#topicList li.topic[data-topic=' + topic + ']').addClass('selected');
}

// update layers list
Gui.loadLayers = function(groups) {
  html = "";
  var layers = [];
  var markerPrefix = new RegExp(Layers.markerPrefix);
  for (var i=0;i<groups.length; i++) {
    var group = groups[i];

    var hasGroup = !group.title.match(markerPrefix);
    if (hasGroup) {
      html += '<div data-role="collapsible" data-theme="c">';
      html += '  <h3>' + group.title + '</h3>';
    }
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
        title: layer.toclayertitle,
        wms_sort: layer.wms_sort,
        visible: layer.visini
      });
    }

    html += '  </fieldset>';
    if (hasGroup) {
      html += '</div>';
    }
  }

  $('#panelLayerAll').html(html);
  $('#panelLayerAll').trigger('create');

  // store layers sorted by wms_sort
  layers = layers.sort(function(a, b) {
    return a.wms_sort - b.wms_sort;
  });
  Map.layers = {};
  for (var i=0; i<layers.length; i++) {
    var layer = layers[i];
    Map.layers[layer.layername] = {
      title: layer.title,
      visible: layer.visible,
      transparency: 0
    }
  }

  Map.setTopicLayer();
  Gui.resetLayerOrder();
}

// add background layer
Gui.loadBackgroundLayers = function(groups) {
  // collect visible layers
  var layers = [];
  for (var i=0;i<groups.length; i++) {
    var group = groups[i];
    for (var j=0;j<group.layers.length; j++) {
      var layer = group.layers[j];
      if (layer.visini) {
        layers.push({
          layername: layer.layername,
          wms_sort: layer.wms_sort
        });
      }
    }
  }
  // sort by wms_sort
  layers = layers.sort(function(a, b) {
    return a.wms_sort - b.wms_sort;
  });
  var sortedLayers = [];
  for (var i=0; i<layers.length; i++) {
    sortedLayers.push(layers[i].layername);
  }
  Map.backgroundLayers = sortedLayers.join(',');
  Map.setBackgroundLayer();
}

// fill layer order panel from visible layers
Gui.resetLayerOrder = function() {
  var html = '';
  for (var layer in Map.layers) {
    if (Map.layers[layer].visible) {
      // NOTE: fill in reverse order, with layers drawn from bottom to top
      html = '<li data-layer="' + layer + '">' + Map.layers[layer].title + '</li>' + html;
    }
  }
  $('#listOrder').html(html);
  $('#listOrder').listview('refresh');

  Gui.selectLayer(null);
}

// add/remove layer in layer order panel
Gui.updateLayerOrder = function(layer, layerAdded) {
  if (layerAdded) {
    // add layer on top
    var html = '<li data-layer="' + layer + '">' + Map.layers[layer].title + '</li>';
    $('#listOrder').prepend(html);
  }
  else {
    // remove layer
    $('#listOrder li[data-layer="' + layer + '"]').remove();
  }
  $('#listOrder').listview('refresh');

  Gui.onLayerOrderChanged(null, null);
}

// update layer order in map
Gui.onLayerOrderChanged = function(event, ui) {
  // unselect layer
  Gui.selectLayer(null);

  // get layer order from GUI
  var orderedLayers = {};
  $($('#listOrder li').get().reverse()).each(function(index) {
    var layer = $(this).data('layer');
    orderedLayers[layer] = Map.layers[layer];
  });

  // append inactive layers
  for (layer in Map.layers) {
    if (orderedLayers[layer] === undefined) {
      orderedLayers[layer] = Map.layers[layer];
    }
  }

  // update map
  Map.layers = orderedLayers;
  Map.refresh();
}

// select layer in layer order panel
Gui.selectLayer = function(layer) {
  // unselect all layer buttons
  $('#listOrder li').removeClass('selected');

  Gui.selectedLayer = layer;
  if (Gui.selectedLayer != null) {
    // mark layer button
    $('#listOrder li[data-layer="' + layer + '"]').addClass('selected');

    // update slider
    $('#sliderTransparency').val(Map.layers[layer].transparency).slider("refresh");
    $('#sliderTransparency').slider("enable");
  }
  else {
    $('#sliderTransparency').val(0).slider("refresh");
    $('#sliderTransparency').slider("disable");
  }
}

// show feature info results
Gui.showFeatureInfoResults = function(data) {
  if (Config.featureInfo.format === 'text/xml') {
    FeatureInfo.parseResults(data);
  }
  else {
    $('#featureInfoResults').html(data.join(''));
  }

  $('#panelFeatureInfo').panel('open');
  Map.toggleClickMarker(true);
}

// convert XML feature info results to HTML
Gui.showXMLFeatureInfoResults = function(results) {
  html = "";
  for (var i=0;i<results.length; i++) {
    var result = results[i];

    html += '<div data-role="collapsible"  data-collapsed="false" data-theme="c">';
    html += '  <h3>' + result.layer + '</h3>';

    for (var j=0; j<result.features.length; j++) {
      var feature = result.features[j];
      var title = feature.id === null ? I18n.featureInfo.raster : I18n.featureInfo.feature + feature.id;

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
    html = I18n.featureInfo.noFeatureFound;
  }

  $('#featureInfoResults').html(html);
  $('#featureInfoResults').trigger('create');
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
  Map.zoomToExtent(bbox, Config.map.minScaleDenom.search);

  // disable following
  $('#switchFollow').val('off');
  $('#switchFollow').slider('refresh');
  Map.toggleFollowing(false);

  $('#panelSearch').panel('close');
}

// binds the reorder functionality to the visible layer list
$(document).bind('pageinit', function() {
  $('#listOrder').sortable();
  $('#listOrder').bind('sortstop', Gui.onLayerOrderChanged);
});

Gui.updateTranslations = function() {
  document.title = I18n.title;

  $('#panelSearch b').html(I18n.search.header);
  $('#panelSearch #searchResults b').html(I18n.search.results);

  $('#panelProperties b').html(I18n.properties.header);
  $('#panelProperties label[for=switchFollow]').html(I18n.properties.mapFollowing);
  $('#panelProperties label[for=switchOrientation]').html(I18n.properties.mapRotation);
  $('#panelProperties label[for=switchScale]').html(I18n.properties.scaleBar);
  $('#panelProperties .ui-slider-label:contains(Ein)').html(I18n.properties.on);
  $('#panelProperties .ui-slider-label:contains(Aus)').html(I18n.properties.off);
  $('#panelProperties #buttonLogo .ui-btn-text').html(I18n.properties.about);
  $('#panelProperties #dlgAbout h1').html(I18n.about.header);
  $('#panelProperties #buttonShare .ui-btn-text').html(I18n.properties.share);
  $('#panelProperties #buttonLogin .ui-btn-text').html(I18n.properties.login);

  $('#panelLayer #buttonTopics .ui-btn-text').html(I18n.layers.topics);
  $('#panelLayer #buttonLayerAll .ui-btn-text').html(I18n.layers.layers);
  $('#panelLayer #buttonLayerOrder .ui-btn-text').html(I18n.layers.layerOrder);
  $('#panelLayer #sliderTransparency-label').html(I18n.layers.transparency);

  $('#panelFeatureInfo b').html(I18n.featureInfo.header);
}

Gui.initViewer = function() {
  UrlParams.parse();

  Gui.updateTranslations();

  Gui.updateLayout();
  $(window).on('resize', function() {
    Gui.updateLayout();
  });

  // map
  Map.createMap(Gui.showFeatureInfoResults);
  Gui.updateLayout();

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
  Topics.loadTopics(Config.data.topicsUrl, Gui.loadTopics);
  // topic selection
  $('#topicList').delegate('li.topic', 'vclick', function(e) {
    Gui.selectTopic($(this).data('topic'));
    $('#panelLayer').panel('close');
  });

  // layer change
  $('#panelLayerAll').delegate(':checkbox', 'change', function(e) {
    Map.setLayerVisible($(this).data('layer'), $(this).is(':checked'), false);
    Gui.updateLayerOrder($(this).data('layer'), $(this).is(':checked'));
  });
  Gui.panelSelect('panelTopics');

  // selection in layer order
  $('#listOrder').delegate('li', 'vclick', function() {
    Gui.selectLayer($(this).data('layer'));
  });
  // layer transparency
  $('#sliderTransparency').on('slidestop', function() {
    Map.setLayerTransparency(Gui.selectedLayer, $(this).val(), true);
  }).parent().on('swipeleft',function(e,ui) {
    // block panel close
    e.stopPropagation();
  });

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
  FeatureInfo.setCallback(Gui.showXMLFeatureInfoResults);

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
      Search.submit(searchString, Gui.showSearchResults);
      // close virtual keyboard
      $('#searchInput').blur();
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
  }).parent().on('swiperight',function(e,ui) {
    // block panel close
    e.stopPropagation();
  });
  $('#switchOrientation').on('change', function(e) {
    Gui.orientation = $(this).val() == 'on';
    Map.toggleOrientation(Gui.orientation);
  }).parent().on('swiperight',function(e,ui) {
    // block panel close
    e.stopPropagation();
  });
  $('#switchScale').on('change', function(e) {
    Map.toggleScalebar($(this).val() == 'on');
  }).parent().on('swiperight',function(e,ui) {
    // block panel close
    e.stopPropagation();
  });

  // about popup
  $('#aboutContent').html(I18n.about.content);
}

$(document).ready(function(e) {
  Gui.initViewer();
});
