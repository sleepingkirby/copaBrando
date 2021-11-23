//loading external files and settings.
(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  var stack=[]; //the stack that the page actually uses. chrome.storage.local is too slow to keep up nor can it keep order. I've tried
  var tmpStack=[]; //temporary stack, for when "keep stack" is set
  var settings={}; //chrome.storage.local.get(null); to be updated when changed and then signaled (to reduce load).
  var cpSt=false; //copy state
  var pstSt=false; // paste state

  /*------------------------------------------------------------------------------------------------
  pre: none
  post: none
  pass in mouseover event and settings to evaluate if button pressed matches what's in settings
  ------------------------------------------------------------------------------------------------*/
  function altKeyPrssd(e, btns){
  var tr={"control":"ctrl", "alt":"alt", "shift":"shift"};
    for(let k in btns){
      if(btns[k]!=e[k+"Key"]){
        return false;
      }
    }
  return true;
  }

  /*------------------------------------------------------------------------------------------------
  pre: altKeyPrssd()
  post: none
  params: e from event, btns with struct {"ctrl":true, "shift":true, "alt": false}
  return: boolean
  checks to see what buttons are released in the event "keyUp"
  different from altKeyPrssd because the data structure for keyUp is different from
  mouseOver. But uses altKeyPrssd() because some parts are the same.
  ------------------------------------------------------------------------------------------------*/
  function keyUpPrssd(e, btns){
  
    if(!"key" in e || !btns ||!e.key||e.key===""||e.key===undefined){
    console.log("failed");
    return false;
    }
  //shift+alt = meta
  var tr={"control":"ctrl", "alt":"alt", "shift":"shift", "meta":"alt"};
    //if main button pressed (after translation) isn't in the list of buttons pressed, it automatically fails.
    //keyup HAS to have e.key. And if we're saying that all of btns HAS to match to be true and e.key isn't in btns
    //it has to fail.
    if(!btns.hasOwnProperty(tr[e.key.toLocaleLowerCase()]) || btns[tr[e.key.toLocaleLowerCase()]]!=true){
    return false;
    }

  var tmpH=Object.assign({}, btns);
  delete tmpH[tr[e.key.toLocaleLowerCase()]]; //it e.key does match, not need to check it again.
  return altKeyPrssd(e,tmpH);
  }

  
  /*------------------------------------------------------------------------------------------------
  pre: none
  post: none
  params: trgt from e.target, lst in settings.cpElBList or pstElBList, pst whether or not you're checking copy or paste
  return: boolean
  returns true or false on whether or not it is in ban list.
  ------------------------------------------------------------------------------------------------*/
  function validEl(trgt, lst, pst=false){
    if(lst.hasOwnProperty(trgt.tagName.toLocaleLowerCase())){
    return false;
    }
    if(pst&&trgt.tagName.toLocaleLowerCase()!="input"&&trgt.tagName.toLocaleLowerCase()!="textarea"&&!trgt.getAttribute("contentEditable")){
    return false;
    }
  return true;
  }

  
  /*------------------------------------------------------------------------------------------------
  pre: settings and stack var exists
  post: settings and stack updated. Also sends badge message
  params: bool true or false, whether or not it sends the message to update the badge
  call to update settings variable and updates, if set, updates badge
  ------------------------------------------------------------------------------------------------*/
  function updtSttng(bool=true){
    chrome.storage.local.get(null, (d)=>{

    settings=Object.assign({},d);
    stack=d.stcks[d.curStck].slice();
      if(bool){
      chrome.runtime.sendMessage({'num':stack.length});
      }
    });
  }


/*---------------------------
pre:
post:
---------------------------*/
  function mouseOvrFnc(e){
    if(e.target && altKeyPrssd(e, settings.pstKeys) && validEl(e.target, settings.pstElBList, true)){
    let txt=settings.keepStck?tmpStack.pop():stack.pop();
    window.focus();
    //console.log("paste: "+txt);
      if(txt&&(e.target.tagName.toLocaleLowerCase()=="input"||e.target.tagName.toLocaleLowerCase()=="textarea")){
      e.target.value=txt;
      }
      else if(txt&&e.target.getAttribute("contentEditable")){
      e.target.innerText=txt;
      }
    pstSt = true;
    let sndNum=stack.length;
      if(settings.keepStck){
      sndNum=tmpStack.length.toString()+"/"+sndNum.toString();
      }
    chrome.runtime.sendMessage({'num':sndNum});
    }

    if(e.target && altKeyPrssd(e, settings.cpKeys) && validEl(e.target, settings.cpElBList, false)&&!settings.keepStck){
    window.focus();
    let txt=null;
      if(e.target.childNodes.length>=1){ 
      txt= e.target.childNodes[0].textContent;
      //console.log("copy: "+txt);  
      stack.push(txt);
      cpSt = true;
      }
      else{
      txt= e.target.value;
      //console.log("copy: "+txt);  
      stack.push(txt);
      cpSt = true;
      }
    chrome.runtime.sendMessage({'num':stack.length});
    }
  }
 

  /*--------------------------------------------------
  pre: keyUpPrssd()
  post: updates settings, stack and/or chrome.storage.local
  terminate state and do any cleanup. i.e. save to chrome storage, reset tmp buffer, etc.
  --------------------------------------------------*/
  function termState(e){
    if(keyUpPrssd(e,settings.pstKeys)&&pstSt){
    //release paste key
    pstSt=false;      
      if(settings.keepStck){
      //console.log("keep stack");
      tmpStack=stack.slice();
      let sndNum=stack.length;
      sndNum=tmpStack.length.toString()+"/"+sndNum.toString();
      chrome.runtime.sendMessage({'num':sndNum});
      }
      else{
      settings["stcks"][settings.curStck]=stack;
      /*
      console.log("==== termState paste=====>>");
      console.log(settings);
      console.log(settings.curStck);
      console.log(stack);
      */
      chrome.storage.local.set(settings,(d)=>{updtSttng();});
      }
    }
 
    if(keyUpPrssd(e,settings.cpKeys)&&cpSt){
    //release copy key
    cpSt=false;
      //if keepStck is stack is set, stack in chrome.storage should not be modified. don't need to update
      if(!settings.keepStck){
      settings["stcks"][settings.curStck]=stack;
      /*
      console.log("==== termState copy=====>>");
      console.log(settings);
      console.log(stack);
      */
      chrome.storage.local.set(settings,(d)=>{updtSttng();});
      }
    }
  }

  /*--------------
  ---------------*/
  function runOnMsg(msg, sender, sendResponse){
    if(!msg&&!msg.hasOwnProperty("action")){
    return false;
    }
  //when tabbed into, update settings and stack.  
    switch(msg.action){
      case 'update settings':
      updtSttng();
      sendResponse(true);
      break;
      case 'keep stack':
      tmpStack=stack.slice();
      updtSttng(false);
      chrome.runtime.sendMessage({'num':tmpStack.length.toString()+"/"+stack.length.toString()});
       
      sendResponse(true);
      break; 
      default:
      break;
    }
  }
  
  
  updtSttng();

  document.addEventListener("mouseover", mouseOvrFnc);
  document.addEventListener("keyup", termState);
  
  chrome.runtime.onMessage.addListener(runOnMsg);
})();




