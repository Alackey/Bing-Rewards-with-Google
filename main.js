
//Waits for user to search for something in the Search Bar
chrome.webRequest.onBeforeRequest.addListener(function(details) {
  var url = details.url.replace("www.google.com/search", "www.bing.com/search");
  console.log('Google to Bing url: ' + url);

  //Checks if there are 2 search queries
  var moddedURL = url.split('&');
  if (moddedURL[moddedURL.length - 1].includes('#q=')){
      url = toOneQuery(moddedURL);
  }

  openTab(url);
  closeTab(url);
}, {urls: ["*://www.google.com/search*"]}, ["blocking"] );

function toOneQuery(moddedURL){
    //Replace the 1st "wrong" query with second
    var mainQuery = moddedURL[0];
    mainQuery = mainQuery.split('?');
    mainQuery = mainQuery[0] + '?' + moddedURL[moddedURL.length - 1].split('#')[1];
    var newURL = mainQuery;

    //Adds the middle contents of the url to the new url
    for (var i = 1; i < moddedURL.length - 1; i++){
        newURL += ('&' + moddedURL[i]);
    }

    //Add ie query(ex. UTF-8)
    newURL += moddedURL[moddedURL.length - 1].split('#')[0];

    return newURL;
}

function openTab(url){
  chrome.tabs.create({'url': url, 'selected': false});
}

function closeTab(url){
  chrome.tabs.query({ url: url}, function (tabs) {

    //Calls closeTab till opened tab is done loading
    if (tabs[0].status == "loading") {
      closeTab(url);
    } else {
      chrome.tabs.remove(tabs[0].id);
    };
  });
}
