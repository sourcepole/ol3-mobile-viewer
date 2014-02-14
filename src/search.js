/**
 * Search base class
 */

function Search() {};

Search.prototype = {
    /**
      * submit search query and invoke the callback with search result features:
      *
      * [
      *   {
      *     name: <visible name>,
      *     bbox: [<minx>, <miny>, <maxx>, <maxy>]
      *   }
      * ]
      */
    submit: function(searchParams, callback) {}
};
