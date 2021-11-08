'use strict';


chrome.storage.local.get(null, (d) => {
console.log(Object.keys(d).length);
  if(Object.keys(d).length <= 0){
    var settings={
    "curStck":"scratch",
    "keepStck":false,
    "cpKeys":{"ctrl":1},
    "pstKeys":{"ctrl":1,"shift":1},
    "stcks":{
      "scratch":[]
      }
    };
    chrome.storage.local.set(settings, (d)=>{});
  }
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
chrome.browserAction.setBadgeText({text: msg.num.toString()});
sendResponse(true);
});


chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {urlMatches: '(http|https|file):/+[a-z]*'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

