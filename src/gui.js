/**
 * jQuery Mobile GUI
 */

var Gui = {};

// login status
Gui.signedIn = false;

// location tracking
Gui.tracking = false;
Gui.following = true;
Gui.orientation = true;

// flag if this is the load on startup
Gui.initialLoad = true;
// currently selected layer in layer order panel
Gui.selectedLayer = null;
// original position of currently dragged layer in layer order panel
Gui.draggedLayerIndex = null;
// flag if layer order has been changed manually
Gui.layerOrderChanged = false;

Gui.updateLayout = function() {
  // use full content size for map
  $('#map').height(window.innerHeight);
  $('#map').width(window.innerWidth);

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
  Gui.selectTopic(Config.permalink.initialTopic || Config.data.initialTopic);
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
  $('#topicList li.topic').removeClass('selected');
  $('#topicList li.topic[data-topic=' + topic + ']').addClass('selected');
}

// update layers list
Gui.loadLayers = function(data) {
  html = "";
  var layers = [];

  function fillLayertree(node, parent, depth) {
    if (node.layers.length > 0) {
      // add group
      html += '<div data-role="collapsible" data-theme="c">';
      html += '  <h3>' + node.name + '</h3>';
    }
    else {
      // find layer parent group
      var groupTitle = parent || Layers.markerPrefix + node.name;
      var group = $.grep(data.groups, function(el) {
        return el.title === groupTitle;
      })[0];
      if (group != undefined) {
        // find layer in group
        var layer = $.grep(group.layers, function(el) {
          return el.layername === node.name;
        })[0];

        // add layer
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
          visible: layer.visini,
          minscale: layer.minscale,
          maxscale: layer.maxscale,
          hidden_attributes: layer.hidden_attributes
        });
      }
    }

    // traverse children
    for (var i=0;i<node.layers.length; i++) {
      fillLayertree(node.layers[i], node.name, depth + 1);
    }

    if (node.layers.length > 0) {
      html += '</div>';
    }
  }

  // fill layer tree
  for (var i=0;i<data.layertree.length; i++) {
    fillLayertree(data.layertree[i], null, 0);
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
      wms_sort: layer.wms_sort,
      minscale: layer.minscale,
      maxscale: layer.maxscale,
      hidden_attributes: layer.hidden_attributes,
      transparency: 0
    }
  }

  Gui.layerOrderChanged = false;
  if (Gui.initialLoad) {
    Gui.applyPermalink();
    Gui.initialLoad = false;
  }
  Map.setTopicLayer();
  Gui.resetLayerOrder();
}

// add background layer
Gui.loadBackgroundLayers = function(data) {
  // collect visible layers
  var groups = data.groups;
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
      html = '<li data-layer="' + layer + '" data-wms_sort="' + Map.layers[layer].wms_sort + '">' + Map.layers[layer].title + '</li>' + html;
    }
  }
  $('#listOrder').html(html);
  $('#listOrder').listview('refresh');

  Gui.selectLayer(null);
}

// add/remove layer in layer order panel
Gui.updateLayerOrder = function(layer, layerAdded) {
  if (layerAdded) {
    var html = '<li data-layer="' + layer + '" data-wms_sort="' + Map.layers[layer].wms_sort + '">' + Map.layers[layer].title + '</li>';

    if (Gui.layerOrderChanged) {
      // add layer on top if layer order has been changed manually
      $('#listOrder').prepend(html);
    }
    else {
      // insert layer at wms_sort position
      // find list element with lower sort order
      var el = $('#listOrder li').filter(function() {
        return $(this).data('wms_sort') < Map.layers[layer].wms_sort;
      }).first();
      if (el.length > 0) {
        el.before(html);
      }
      else {
        // find list element with higher sort order
        el = $('#listOrder li').filter(function() {
          return $(this).data('wms_sort') > Map.layers[layer].wms_sort;
        }).last();
        if (el.length > 0) {
          el.after(html);
        }
        else {
          // add layer on top
          $('#listOrder').prepend(html);
        }
      }
    }
  }
  else {
    // remove layer
    $('#listOrder li[data-layer="' + layer + '"]').remove();
  }
  $('#listOrder').listview('refresh');

  Gui.onLayerOrderChanged(null, null);
}

Gui.onLayerDrag = function(event, ui) {
  // keep track of original position in layer order
  Gui.draggedLayerIndex = $('#listOrder li').index(ui.item);
}

// update layer order in map
Gui.onLayerOrderChanged = function(event, ui) {
  if (ui != null) {
    if ($('#listOrder li').index(ui.item) != Gui.draggedLayerIndex) {
      // layer order has been changed manually
      Gui.layerOrderChanged = true;
    }
  }

  // unselect layer
  Gui.selectLayer(null);

  // get layer order from GUI
  var orderedLayers = {};
  $($('#listOrder li').get().reverse()).each(function(index) {
    var layer = $(this).data('layer');
    orderedLayers[layer] = Map.layers[layer];
  });

  // append inactive layers
  for (var layer in Map.layers) {
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
    var layer = Map.layers[result.layer];

    var layerTitle = result.layer;
    if (layer != undefined) {
      layerTitle = layer.title;
    }

    html += '<div data-role="collapsible"  data-collapsed="false" data-theme="c">';
    html += '  <h3>' + layerTitle + '</h3>';

    var hiddenAttributes = [];
    if (layer != undefined && layer.hidden_attributes != undefined) {
      hiddenAttributes = layer.hidden_attributes;
    }
    for (var j=0; j<result.features.length; j++) {
      var feature = result.features[j];
      var title = feature.id === null ? I18n.featureInfo.raster : I18n.featureInfo.feature + feature.id;

      html += '<div data-role="collapsible"  data-collapsed="false" data-theme="c">';
      html += '  <h3>' + title + '</h3>';
      html += '  <ul data-role="listview">'

      for (var k=0; k<feature.attributes.length; k++) {
        var attribute = feature.attributes[k];

        // skip hidden attributes
        if ($.inArray(attribute.name, hiddenAttributes) == -1) {
          html += '  <li>';
          html += '    <span class="name">' + attribute.name + ': </span>';
          html += '    <span class="value">' + attribute.value + '</span>';
          html += '  </li>';
        }
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
    var categoryResults = results[i];

    // category title
    if (categoryResults.category != null) {
      html += '<li class="category-title">' + categoryResults.category + '</li>';
    }

    // results
    for (var j=0;j<categoryResults.results.length; j++) {
      var result = categoryResults.results[j];
      if (result.bbox != null) {
        html += '<li data-bbox="' + result.bbox.join(',') + '">';
      }
      else {
        html += '<li>';
      }
      html += '  <a href="#">' + result.name + '</a>';
      html += '</li>';
    }
  }

  $('#searchResultsList').html(html);
  $('#searchResultsList').listview('refresh');

  $('#searchResults').show();

  // automatically jump to single result
  if (results.length === 1 && results[0].bbox != null) {
    Gui.jumpToSearchResult(results[0].bbox);
  }
}

// bbox as [<minx>, <miny>, <maxx>, <maxy>]
Gui.jumpToSearchResult = function(bbox) {
  Map.zoomToExtent(bbox, Config.map.minScaleDenom.search);

  // disable following
  $('#switchFollow').val('off');
  $('#switchFollow').slider('refresh');
  Gui.toggleFollowing(false);

  $('#panelSearch').panel('close');
}

// binds the reorder functionality to the visible layer list
$(document).bind('pageinit', function() {
  $('#listOrder').sortable();
  $('#listOrder').bind('sortstart', Gui.onLayerDrag);
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
  $('#dlgAbout h1').html(I18n.about.header);
  $('#panelProperties #buttonShare .ui-btn-text').html(I18n.properties.share);
  $('#panelProperties #buttonLogin .ui-btn-text').html(I18n.properties.login);
  $('#panelProperties #buttonLoginSSL .ui-btn-text').html(I18n.properties.login);
  $('#dlgLogin h1').html(I18n.login.header);
  $('#dlgLogin label[for=user]').html(I18n.login.user);
  $('#dlgLogin label[for=password]').html(I18n.login.password);
  $('#dlgLogin #buttonSignIn .ui-btn-text').html(I18n.login.signIn);
  $('#dlgLogin #buttonLoginCancel .ui-btn-text').html(I18n.login.cancel);
  $('#panelProperties #buttonSignOut .ui-btn-text').html(I18n.login.signOut);

  $('#panelLayer #buttonTopics .ui-btn-text').html(I18n.layers.topics);
  $('#panelLayer #buttonLayerAll .ui-btn-text').html(I18n.layers.layers);
  $('#panelLayer #buttonLayerOrder .ui-btn-text').html(I18n.layers.layerOrder);
  $('#panelLayer #sliderTransparency-label').html(I18n.layers.transparency);

  $('#panelFeatureInfo b').html(I18n.featureInfo.header);
}

Gui.toggleFollowing = function(enabled) {
  Gui.following = enabled;
  Map.toggleFollowing(Gui.tracking && Gui.following);
}

Gui.toggleOrientation = function(enabled) {
  Gui.orientation = enabled;
  Map.toggleOrientation(Gui.orientation);
}

Gui.applyPermalink = function() {
  // visible layers and layer order
  if (Config.permalink.visibleLayers != null) {
    var layers = [];
    var layerOrderChanged = false;
    var lastIndex = -1;
    for (var layer in Map.layers) {
      var index = $.inArray(layer, Config.permalink.visibleLayers);
      var visible = (index != -1);

      // override layer visibility
      Map.layers[layer].visible = visible;

      // update layer tree
      $('#panelLayerAll :checkbox[data-layer="' + layer + '"]').attr('checked', visible).checkboxradio('refresh');

      if (visible) {
        layers.push({
          layername: layer,
          sort: index
        });
        // check if layer order differs from original
        if (!layerOrderChanged) {
          layerOrderChanged = (index < lastIndex);
          lastIndex = index;
        }
      }
    }
    layers = layers.sort(function(a, b) {
      return a.sort - b.sort;
    });

    // update layer order in map
    var orderedLayers = {};
    for (var i=0; i<layers.length; i++) {
      var layer = layers[i].layername;
      // append active layers
      orderedLayers[layer] = Map.layers[layer];
    }
    // append inactive layers
    for (var layer in Map.layers) {
      if (orderedLayers[layer] === undefined) {
        orderedLayers[layer] = Map.layers[layer];
      }
    }
    Map.layers = orderedLayers;
    Gui.layerOrderChanged = layerOrderChanged;
  }

  // opacities
  if (Config.permalink.opacities != null) {
    for (var layer in Config.permalink.opacities) {
      if (Map.layers[layer] != undefined) {
        // scale opacity[255..0] to transparency[0..100]
        var transparency = Math.round((255 - Config.permalink.opacities[layer]) / 255 * 100);
        Map.layers[layer].transparency = transparency;
      }
    }
  }

  // selection
  if (Config.permalink.selection != null) {
    Map.selection = Config.permalink.selection;
  }

  // login
  if (Config.permalink.openLogin) {
    if (Config.sslLogin && UrlParams.useSSL && !Gui.signedIn) {
      // open login form
      $('#panelProperties').panel('open');
      $('#dlgLogin').popup('open');
    }
  }
}

Gui.loginStatus = function(result) {
  if (result.success) {
    $('#dlgLogin').popup('close');
    $('#buttonSignOut .ui-btn-text').html(I18n.login.signOut + " - " + result.user);
    $('#panelProperties').panel('close');
  }
  Gui.toggleLogin(result.success);
}

Gui.login = function(result) {
  if (result.success) {
    // reload topics
    Topics.loadTopics(Config.data.topicsUrl, Gui.loadTopics);

    $('#dlgLogin').popup('close');
    $('#buttonSignOut .ui-btn-text').html(I18n.login.signOut + " - " + result.user);
    Gui.toggleLogin(true);
    $('#panelProperties').panel('close');
  }
  else {
    alert(I18n.login.signInFailed);
  }
}

Gui.logout = function() {
  // reload topics
  Topics.loadTopics(Config.data.topicsUrl, Gui.loadTopics);

  Gui.toggleLogin(false);
}

Gui.toggleLogin = function(signedIn) {
  Gui.signedIn = signedIn;
  $('#buttonLogin').toggle(!signedIn);
  $('#buttonSignOut').toggle(signedIn);
}

Gui.initViewer = function() {
  UrlParams.parse();
  Config.permalink.read(UrlParams.params);

  Gui.updateTranslations();

  Gui.updateLayout();
  $(window).on('resize', function() {
    Gui.updateLayout();
  });
  Map.setWindowOrientation(window.orientation);
  $(window).on('orientationchange', function(e) {
    Map.setWindowOrientation(window.orientation);
  });

  // map
  Map.createMap(Gui.showFeatureInfoResults);
  Gui.updateLayout();

  if (Config.permalink.startExtent != null) {
    Map.zoomToExtent(Config.permalink.startExtent, null);
  }

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
  $('#switchFollow').val(Config.defaultProperties.following ? 'on' : 'off');
  $('#switchFollow').slider('refresh');
  Gui.toggleFollowing(Config.defaultProperties.following);
  $('#switchOrientation').val(Config.defaultProperties.orientation ? 'on' : 'off');
  $('#switchOrientation').slider('refresh');
  Gui.toggleOrientation(Config.defaultProperties.orientation);
  $('#switchScale').val(Config.defaultProperties.scalebar ? 'on' : 'off');
  $('#switchScale').slider('refresh');
  Map.toggleScalebar(Config.defaultProperties.scalebar);

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
  $('#featureInfoResults').parent().on('swipeleft',function(e,ui) {
    // block panel close
    e.stopPropagation();
  });

  // search
  $('#searchInput').bind('change', function(e) {
    // reset search panel
    $('#searchResults').hide();

    var searchString = $(this).val();
    if (searchString != "") {
      // submit search
      Config.search.submit(searchString, Gui.showSearchResults);
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
    Gui.toggleFollowing($(this).val() == 'on');
  }).parent().on('swiperight',function(e,ui) {
    // block panel close
    e.stopPropagation();
  });
  $('#switchOrientation').on('change', function(e) {
    Gui.toggleOrientation($(this).val() == 'on');
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

  // toggle buttons
  $('#buttonShare').toggle(!Config.gui.hideShareButton);
  $('#buttonLogin').toggle(!Config.gui.hideLoginButton);
  $('#buttonLoginSSL').hide();
  $('#buttonSignOut').hide();

  // login
  if (!Config.gui.hideLoginButton) {
    if (Config.sslLogin && !UrlParams.useSSL) {
      // link to secure login
      var url = UrlParams.baseUrl.replace(/^http:/, "https:");
      var params = $.extend(
        {
          openLogin: true
        },
        UrlParams.params
      );
      url += "?" + $.param(params);
      $('#buttonLoginSSL').attr('href', url);
      $('#buttonLoginSSL').show();
      $('#buttonLogin').hide();
    }
    else {
      // login
      $('#buttonSignIn').on('tap', function() {
        Config.login.signIn($('#user').val(), $('#password').val(), Gui.login);
      });
      $('#buttonLoginCancel').on('tap', function() {
        $('#dlgLogin').popup('close');
      });
      $('#buttonSignOut').on('tap', function() {
        Config.login.signOut(Gui.logout);
      });
      // initial login status
      Config.login.status(Gui.loginStatus);
    }
  }

  // workaround for erroneus map click despite open panels on iOS
  $('#panelFeatureInfo, #panelLayer, #panelSearch').on('panelopen', function() {
    Map.toggleClickHandler(false);
  });
  $('#panelFeatureInfo, #panelLayer, #panelSearch').on('panelclose', function() {
    Map.toggleClickHandler(true);
  });
}

$(document).ready(function(e) {
  Gui.initViewer();
});
