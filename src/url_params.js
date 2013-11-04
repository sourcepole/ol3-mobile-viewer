/**
 * UrlParams
 *
 * parse URL parameters
 *
 * tiledWms=<1|0>: force tiled/untiled WMS
 */

var UrlParams = {};

// URL parameters
UrlParams.params = {};

// parse URL parameters
UrlParams.parse = function() {
  var  urlString = "";
  if (document.documentURI) {
    // all browsers except older IE
    urlString = document.documentURI;
  }
  else {
    // older IE
    urlString = window.location.href;
  }

  var urlArray = urlString.split('?');
  if (urlArray.length > 1) {
    var kvPairs = urlArray[1].split('&');
    for (var i=0; i<kvPairs.length; i++) {
      var kvPair = kvPairs[i].split('=');
      UrlParams.params[kvPair[0]] = kvPair[1];
    }
  }
}
