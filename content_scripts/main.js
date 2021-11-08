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

  var stack=[];
  var tmpStack=[];
  var settings={}; //chrome.storage.local.get(null); to be updated when changed and then signaled (to reduce load).
  var cpSt=false; //copy state
  var pstSt=false; // paste state

  //pass in mouseover event and settings to evaluate if button pressed matches settings.
  function btnPrssd(e, ){
  return true;
  }

  //pass in e.target and settings.copyList. returns true or false on whether or not it is in list
  function validEl(trgt, lst){
  }

  //call to update settings variable.
  function updtSttng(){
    chrome.storage.local.get(null, (d)=>{
    console.log(d);
    settings=d;
    });
  }

  updtSttng();

/*---------------------------
pre:
post:
---------------------------*/
  function mouseOvrFnc(e){
    if(e.target && e.ctrlKey && e.target.innerText!="" && e.target.tagName.toLocaleLowerCase()=="div"){
    let txt= e.target.childNodes[0].textContent;
    console.log("=============>>");
    console.log(txt);
    stack.push(txt);
    console.log(stack);
    chrome.runtime.sendMessage({'num':stack.length});
    }
    else if(e.target && e.altKey && (e.target.tagName.toLocaleLowerCase()=="input" || e.target.tagName.toLocaleLowerCase()=="textarea")){
    let txt=stack.pop();
      if(txt){
      e.target.value=txt;
      }
    console.log(stack);
    chrome.runtime.sendMessage({'num':stack.length});
    }
  }
  
  //terminate state and do any cleanup. i.e. save to chrome storage, reset tmp buffer, etc.
  function termState(e){
  console.log(e);
    if(btnPrssd(e,settings.cpKeys)&&cpSt){
    console.log(e);
    //release copy key
    cpSt=false;
      //if keepStck is stack is set, stack in chrome.storage should not be modified. don't need to update
      if(!settings.keepStck){
        chrome.storage.local.set({},(d)=>{});
      }
    }
  /*
    if(btnPrssd(e,settings.cpKeys)&&pstSt){
    //release paste key
    pstSt=false;      
      if(settings.keepStck){
      tmpStack=stack;
      }
      else{
      chrome.storage.local({settings.stacks[settngs.curStck]:stack};
      }
    }
  */
  }

  /*--------------
  ---------------*/
  function runOnMsg(msg, sender, sendResponse){
  //when tabbed into, update settings and stack.  

  }

  document.addEventListener("mouseover", mouseOvrFnc);
  document.addEventListener("keyup", termState);
  
  chrome.runtime.onMessage.addListener(runOnMsg);
})();




