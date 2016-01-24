var tabUrls = {};
var bingUrlRemoveFromList = -1;

//Waits for user to search for something in the Search Bar
chrome.webRequest.onBeforeRequest.addListener(function(details) {
    var url = details.url.replace("www.google.com/search", "www.bing.com/search");

    //Checks if there are 2 search queries
    var moddedURL = url.split('&');
    if (moddedURL[moddedURL.length - 1].includes('#q=')){
        url = toOneQuery(moddedURL);
    }

    bingUrlRemoveFromList = url;

    openTab(url);
    closeTab(url);
}, {urls: ["*://www.google.com/search*"]}, ["blocking"] );

chrome.storage.local.set({'RecentlyClosed': []});

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

    //Add ie query(ex. ie=UTF-8)
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
        }

    });
}

//Remove tabs opened when computer wakes from sleep
chrome.webRequest.onBeforeRequest.addListener(function(details) {
        chrome.tabs.remove(details.tabId);
    }, {urls: ["https://www.bing.com/searchdomaincheck?format=domain&type=chrome"]}
);

//Open Recently Closed Tab
chrome.commands.onCommand.addListener(function(command) {
    chrome.storage.local.get('RecentlyClosed', function (recentlyClosedStorage) {

        if (Object.getOwnPropertyNames(recentlyClosedStorage.RecentlyClosed).length === 1){
            //If our Recently Closed list is empty
            chrome.sessions.getRecentlyClosed( function (recentlyClosedSession) {
                for (var tab of recentlyClosedSession){
                    recentlyClosedStorage.RecentlyClosed.unshift(tab.tab.url);
                }
                saveThenOpen(recentlyClosedStorage.RecentlyClosed);
            });
        } else {
            //Open Next Tab
            saveThenOpen(recentlyClosedStorage.RecentlyClosed);
        }

    });
});

function saveThenOpen(RecentlyClosed) {
    var url = RecentlyClosed.pop();
    chrome.storage.local.set({'RecentlyClosed': RecentlyClosed});
    chrome.tabs.create({'url': url, 'selected': true});
}

//Adds closed tab to Recently Closed tabs
chrome.tabs.onRemoved.addListener(function (tabID, info) {

    if (tabUrls[tabID] == 'remove') {
        delete tabUrls[tabID];
    } else {
        chrome.storage.local.get('RecentlyClosed', function (recentlyClosedStorage) {
            recentlyClosedStorage.RecentlyClosed.push(tabUrls[tabID]);
            delete tabUrls[tabID];
            chrome.storage.local.set({'RecentlyClosed': recentlyClosedStorage.RecentlyClosed});
        });
    }

});

chrome.tabs.onUpdated.addListener(function (tabID, tabInfo) {

    //Update URL for a current or new tab
    if (tabInfo.hasOwnProperty('url')) {
        if (bingUrlRemoveFromList != tabInfo.url) {
            tabUrls[tabID] = tabInfo.url;
        } else {
            //Tab with Bing Search
            bingUrlRemoveFromList = -1;
            tabUrls[tabID] = 'remove';
        }
    }

});
