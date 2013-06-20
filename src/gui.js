/**
 * jQuery Mobile GUI
 */

function updateLayout() {
  // use full content height for map
  $("#map").height(window.innerHeight - $("#header ").outerHeight());

  // limit panels to screen height
  $('#panelTopics .ui-listview').height(window.innerHeight - 140);
  $('#panelLayerAll').height(window.innerHeight - 140);
  $('#panelLayerOrder .ui-listview').height(window.innerHeight - 223);
  $('#properties').height(window.innerHeight - 100);
}

// show selected panel
function panelSelect(panel) {
  $('#panelTopics').toggle(panel === 'panelTopics');
  $('#panelLayerAll').toggle(panel === 'panelLayerAll');
  $('#panelLayerOrder').toggle(panel === 'panelLayerOrder');
}

// fill topics list
function loadTopics(categories) {
  html = "";
  for (var i=0;i<categories.length; i++) {
    var category = categories[i];

    html += '<li data-role="list-provider">' + category.title + '</li>';

    for (var j=0;j<category.topics.length; j++) {
      var topic = category.topics[j];
      html +=    '<li><a href="#">';
      html +=    '  <img src="' + topic.icon + '"/>';
      html +=    '  <p style="white-space:pre-wrap">' + topic.title + '</p></a>';
      html +=    '</li>';
    }
  }

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
  Topics.loadTopics("src/topics.json", loadTopics);
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
