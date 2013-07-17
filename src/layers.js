/**
 * Load layers
 */

var Layers = {};

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
    // sort by toc_sort
    var wmslayers = data.wmslayers.sort(function(a, b) {
      return a.toc_sort - b.toc_sort;
    });

    // group by groupname
    groups = {};
    for (var i=0;i<wmslayers.length; i++) {
      var layer = wmslayers[i];

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
