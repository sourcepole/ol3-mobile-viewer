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
    // sort by categorysort
    var gbtopics = data.gbtopics.sort(function(a, b) {
      return a.categorysort - b.categorysort;
    });

    // group by category
    categories = {};
    for (var i=0;i<gbtopics.length; i++) {
      var topic = gbtopics[i];

      if (categories[topic.categorytitle] === undefined) {
        categories[topic.categorytitle] = [];
      }
      categories[topic.categorytitle].push(topic);
    }

    var sortedCategories = [];
    for (var key in categories) {
      if (categories.hasOwnProperty(key)) {
        // sort by categories_topics_sort
        var topics = categories[key].sort(function(a, b) {
          return a.categories_topics_sort - b.categories_topics_sort;
        });
        sortedCategories.push({
          title: key,
          topics: topics
        });
      }
    }

    callback(sortedCategories);
  });
};
