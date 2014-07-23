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
      *     category: <category>, // null to hide
      *     results: [
      *       {
      *         name: <visible name>,
      *         bbox: [<minx>, <miny>, <maxx>, <maxy>]
      *       }
      *     ]
      *   }
      * ]
      */
    submit: function(searchParams, callback) {}
};
