'use strict';


browser.storage.local.get().then((d) => {
  if(Object.keys(d).length <= 0){
    var settings={
    "curStck":"scratch",
    "keepStck":{"scratch":false},
    "cpKeys":{"ctrl":true, "shift":true, "alt": false},
    "pstKeys":{"ctrl":true, "shift":false, "alt": false},
    "cpElBList":{"body":true, "style":true, "script":true, "head":true, "html":true},
    "pstElBList":{},
      "stcks":{
      "scratch":[]
      },
    "hghlghtCp": false,
    "pstFrmStck": false,
      "shrtCts":{
      "pst":{"v":true,"alt":true}
      },
    "datetime":Date.parse(new Date())
    };
    browser.storage.local.set(settings).then((d)=>{});
  }
});

//tell active tabe to update settings
browser.tabs.onActivated.addListener(function(activeInfo){
  browser.tabs.query({active:true, currentWindow:true},function(tabs){
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("browser")==0){
    return null;
    }
    browser.tabs.sendMessage(tabs[0].id, {action:"update settings"});
  });
});


browser.windows.onFocusChanged.addListener(function(activeInfo){
  browser.tabs.query({active:true, currentWindow:true},function(tabs){
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("browser")==0){
    return null;
    }
    browser.tabs.sendMessage(tabs[0].id, {action:"update settings"});
  });

});


browser.runtime.onMessage.addListener(function(msg, sender, sendResponse){
  if(msg.hasOwnProperty('num')){
  browser.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    if(msg.num<=0){
    browser.browserAction.setBadgeText({text: ""});
    }
    else{
    browser.browserAction.setBadgeText({text: msg.num.toString()});
    }
  }
  /*possibly for syncing.
  if(msg.hasOwnProperty('syncAll')){
  }
  */
sendResponse(true);
});

/*------- enables toolbar icon when conditions are met. Doesn't need/not supported for firefox------------
browser.runtime.onInstalled.addListener(function() {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function() {
    browser.declarativeContent.onPageChanged.addRules([{
      conditions: [new browser.declarativeContent.PageStateMatcher({
        pageUrl: {urlMatches: '(http|https|file):/+[a-z]*'},
      })],
      actions: [new browser.declarativeContent.ShowPageAction()]
    }]);
  });
});
--------------------------------------------------------------------------------------------------------*/

