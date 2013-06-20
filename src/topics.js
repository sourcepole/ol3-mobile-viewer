/**
 * Load topics
 */

var Topics = {};

/**
 * get topics as JSON and return the topics grouped by category
 *
 * [
 *   {
 *     title: <category>,
 *     topics: [
 *       <topic data from gbtopics>
 *     ]
 *   }
 * ]
 */
Topics.loadTopics = function(url, callback) {
  $.getJSON(url, function(data) {
    // group by category
    categories = {};
    for (var i=0;i<data.gbtopics.length; i++) {
      var topic = data.gbtopics[i];

      if (categories[topic.categorytitle] === undefined) {
        categories[topic.categorytitle] = [];
      }
      categories[topic.categorytitle].push(topic);
    }

    // TODO: sort by categorysort and categories_topics_sort
    var sortedCategories = [];
    for (var key in categories) {
      if (categories.hasOwnProperty(key)) {
        sortedCategories.push({
          title: key,
          topics: categories[key]
        });
      }
    }

    callback(sortedCategories);
  });
};
