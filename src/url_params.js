/**
 * UrlParams
 *
 * parse URL parameters
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
  // replace spaces encoded as '+'
  urlString = urlString.replace(/\+/g, ' ');
  urlString = decodeURI(urlString);

  var urlArray = urlString.split('?');
  if (urlArray.length > 1) {
    var kvPairs = urlArray[1].split('&');
    for (var i=0; i<kvPairs.length; i++) {
      var kvPair = kvPairs[i].split('=');
      UrlParams.params[kvPair[0]] = kvPair[1];
    }
  }
}
