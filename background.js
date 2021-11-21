'use strict';


chrome.storage.local.get(null, (d) => {
  if(Object.keys(d).length <= 0){
    var settings={
    "curStck":"scratch",
    "keepStck":false,
    "cpKeys":{"ctrl":true, "shift":true, "alt": false},
    "pstKeys":{"ctrl":true, "shift":false, "alt": false},
    "cpElBList":{"body":true, "style":true, "script":true, "head":true, "html":true},
    "pstElBList":{},
    "stcks":{
      "scratch":[]
      }
    };
    chrome.storage.local.set(settings, (d)=>{});
  }
});

//tell active tabe to update settings
chrome.tabs.onActivated.addListener(function(activeInfo){
  chrome.tabs.query({active:true, currentWindow:true},function(tabs){
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("chrome")==0){
    return null;
    }
    chrome.tabs.sendMessage(tabs[0].id, {action:"update settings"});
  });
});


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
  if(msg.num<=0){
  chrome.browserAction.setBadgeText({text: ""});
  }
  else{
  chrome.browserAction.setBadgeText({text: msg.num.toString()});
  }
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

