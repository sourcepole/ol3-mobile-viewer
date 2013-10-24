/**
 * Load layers
 */

var Layers = {};

// prefix to mark layers without group
Layers.markerPrefix = "____";

/**
 * get layers as JSON and return the layers grouped by groupname
 *
 * [
 *   {
 *     title: <group>,
 *     layers: [
 *       <layer data from wmslayers>
 *     ]
 *   }
 * ]
 */
Layers.loadLayers = function(url, callback) {
  $.getJSON(url, function(data) {
    // sort by reverse toc_sort
    var wmslayers = data.wmslayers.sort(function(a, b) {
      return b.toc_sort - a.toc_sort;
    });

    // group by groupname
    groups = {};
    for (var i=0;i<wmslayers.length; i++) {
      var layer = wmslayers[i];

      if (layer.groupname === null) {
        // mark layers without group
        layer.groupname = Layers.markerPrefix + layer.layername;
      }
      if (groups[layer.groupname] === undefined) {
        groups[layer.groupname] = [];
      }
      groups[layer.groupname].push(layer);
    }

    var sortedGroups = [];
    for (var key in groups) {
      if (groups.hasOwnProperty(key)) {
        sortedGroups.push({
          title: key,
          layers: groups[key]
        });
      }
    }

    callback(sortedGroups);
  });
}
