/**
 * Permalink base class
 *
 * tiledWms=<1|0>: force tiled/untiled WMS
 * topic=<topic name>
 * startExtent=<minx>,<miny>,<maxx>,<maxy>
 * visibleLayers=<comma separated layer names>
 * opacities=<JSON of {<layer name>:<opacity[255..0]>}>
 * selection=<layer name>:<comma separated feature ids>
 */

function Permalink() {
  // <1|0>
  this.useTiledWMS = null;
  // <topic name>
  this.initialTopic = null;
  // [<minx>, <miny>, <maxx>, <maxy>]
  this.startExtent = null;
  // [<layer name>]
  this.visibleLayers = null;
  // {<layer name>:<opacity[255..0]>}
  this.opacities = null;
  // <layer name>:<comma separated feature ids>
  this.selection = null;
};

Permalink.prototype = {
  /**
   * read URL parameters to setup map accordingly
   *
   * urlParams = {
   *   <key>: <value>
   * }
   */
  read: function(urlParams) {
    if (urlParams.tiledWms != undefined) {
      this.useTiledWMS = (urlParams.tiledWms == 1);
    }
    if (urlParams.topic != undefined) {
      this.initialTopic = urlParams.topic;
    }
    if (urlParams.openLogin != undefined) {
      this.openLogin = urlParams.openLogin;
    }

    // QGIS Web-Client permalink parameters
    if (urlParams.startExtent != undefined) {
      this.startExtent = $.map(urlParams.startExtent.split(','), function(value, index) {
        return parseFloat(value);
      });
    }
    if (urlParams.visibleLayers != undefined) {
      this.visibleLayers = urlParams.visibleLayers.split(',');
    }
    if (urlParams.opacities != undefined) {
      try {
        this.opacities = $.parseJSON(urlParams.opacities);
      }
      catch (e) {
        alert("opacities:\n" + e);
      }
    }
    if (urlParams.selection != undefined) {
      this.selection = urlParams.selection;
    }
  }
};

/**
 * Create a subclass for custom permalink parameters
 */
/*
function CustomPermalink() {};

// inherit from Permalink
CustomPermalink.prototype = new Permalink();

CustomPermalink.prototype.read = function(urlParams) {
  // default permalink parameters
  Permalink.prototype.read.apply(this, arguments)

  // custom permalink handling
}
*/

