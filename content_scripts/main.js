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

  var stack=[]; //the stack that the page actually uses. browser.storage.local is too slow to keep up nor can it keep order. I've tried
  var tmpStack=[]; //temporary stack, for when "keep stack" is set
  var settings={}; //browser.storage.local.get(null); to be updated when changed and then signaled (to reduce load).
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
    return false;
    }
  //shift+alt = meta
  var tr={"control":"ctrl", "alt":"alt", "shift":"shift", "meta":"alt"};
    //if main button pressed (after translation) isn't in the list of buttons pressed, it automatically fails.
    //keyup HAS to have e.key. And if we're saying that all of btns HAS to match to be true and e.key isn't in btns
    //it has to fail.
    if(tr.hasOwnProperty(e.key.toLocaleLowerCase()) && (!btns.hasOwnProperty(tr[e.key.toLocaleLowerCase()]) || btns[tr[e.key.toLocaleLowerCase()]]!=true)){
    return false;
    }
  var tmpH=Object.assign({}, btns);
    if(tr.hasOwnProperty(e.key.toLocaleLowerCase())){
    delete tmpH[tr[e.key.toLocaleLowerCase()]]; //it e.key does match, not need to check it again.
    }
    else{
    delete tmpH[e.key.toLocaleLowerCase()]; //it e.key does match, not need to check it again.
    }
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
    if(lst && lst.hasOwnProperty(trgt.tagName.toLocaleLowerCase())){
    return false;
    }
    if(pst&&trgt.tagName.toLocaleLowerCase()!="input"&&trgt.tagName.toLocaleLowerCase()!="textarea"&&!trgt.getAttribute("contentEditable")){
    return false;
    }
  return true;
  }


  //a hack function to copy to clipboard
  function copyHack(str){
  /*
  var ta=document.createElement("textarea");
  ta.textContent=str;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy', false, null);
  document.body.removeChild(ta);
  */
    navigator.clipboard.writeText(str).then(
      (e)=>{
      console.log('Copied "'+str+'"');
      },
      (err)=>{
        if(err=="DOMException: Document is not focused."||e=="NotAllowedError: Document is not focused."){
        console.log('Click on page to begin copying');
        }
        console.log('copaBrando: function copyHack() failed to copy. Error: "'+err+'"');
      });
  }


  /*--------------------------------------------
  pre: none
  post:
  sends events that makes forms that cache your input rather
  just reading the d*mn input forms for the values
  actually work and persist.
          onEl.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
        onEl.dispatchEvent(new Event('change',{bubbles:true}));
        onEl.value=ptr;
        onEl.dispatchEvent(new Event('change',{bubbles:true}));
  using:
  https://higherme.bamboohr.com/jobs/view.php?id=25&source=aWQ9MjY%3D
  as example
  ---------------------------------------------*/
  function smrtFill(el, val, type, flag=true, appnd=false){

  var vls='value';
    switch(type){
      case 'contentEditable':
      vls='innerText';
      break;
      case 'checked':
      vls='checked';
      break;
      default:
      vls='value';
      break;
    }

    if(appnd && vls=="value"){

      el.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el[vls]=el[vls];
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el[vls]+=val;
      return 0;
    }

    if(!flag){
    el[vls]=val;
    return 0;
    }

    el.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el[vls]=val;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el[vls]=val;
    return 0;
  }
 

 
  /*------------------------------------------------------------------------------------------------
  pre: settings and stack var exists
  post: settings and stack updated. Also sends badge message
  params: bool true or false, whether or not it sends the message to update the badge
  call to update settings variable and updates, if set, updates badge
  ------------------------------------------------------------------------------------------------*/
  function updtSttng(bool=true){
    browser.storage.local.get().then((d)=>{
    settings=Object.assign({},d);
    stack=d.stcks[d.curStck].slice();
    tmpStack=d.stcks[d.curStck].slice();
      if(bool){
      browser.runtime.sendMessage({'num':stack.length});
      }
    });
  }


/*---------------------------
pre:
post:
---------------------------*/
  function mouseOvrFnc(e){
    if(e && e.target && altKeyPrssd(e, settings.pstKeys) && validEl(e.target, settings.pstElBList, true)){
    console.log("asfdasdf");
    let txt=settings.keepStck[settings.curStck]?tmpStack.pop():stack.pop();
    window.focus();
    //console.log("paste: "+txt);
      if(typeof txt=="string"){
        if(e.target.tagName.toLocaleLowerCase()=="input"||e.target.tagName.toLocaleLowerCase()=="textarea"){
        //smrtFill(onEl, false, 'checked', flag);
        smrtFill(e.target, txt, 'value',true);
        }
        else if(e.target.getAttribute("contentEditable")){
        smrtFill(e.target, txt, 'contentEditable',true);
        }
      }
    pstSt = true;
    let sndNum=stack.length;
      if(settings.keepStck[settings.curStck]){
      sndNum=tmpStack.length.toString()+"/"+sndNum.toString();
      }
    browser.runtime.sendMessage({'num':sndNum});
    }

    if(e && e.target && altKeyPrssd(e, settings.cpKeys) && validEl(e.target, settings.cpElBList, false)&& settings.keepStck && settings.keepStck.hasOwnProperty(settings.curStck) && !settings.keepStck[settings.curStck]){
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
    browser.runtime.sendMessage({'num':stack.length});
    }
  }

  /*---------------------------------------------
  pre: global variable stack and settings set, updtSttng();
  post: browser.storage.local updated from local settings
  sets the browser.storage.local to local settings.
  ---------------------------------------------*/
  function updtChromeStorage(){
  let sndNum=stack.length;
    if(settings.keepStck[settings.curStck]){
    sndNum=tmpStack.length.toString()+"/"+sndNum.toString();
    }
    else{
    settings["stcks"][settings.curStck]=stack.slice();
    browser.storage.local.set(settings).then((d)=>{updtSttng();});
    }
  browser.runtime.sendMessage({'num':sndNum});
  }


  /*---------------------------------------------
  pre:
  post:
  this happens AFTER paste happens 
  ---------------------------------------------*/
  function myPst(e){
    if(!settings.pstFrmStck){
    return null;
    }
    
    
    var clpDt=null;
    var oldtxt=null;
    var txt=null;

    //e.stopPropagation();
    //e.preventDefault();
    var types = e.clipboardData.types;
    clpDt = e.clipboardData || window.clipboardData;


    //if not string, do nothing. Let it naturally paste
    if(!(types instanceof DOMStringList) || !types.contains("text/html")){
    settings.keepStck[settings.curStck]?tmpStack[tmpStack.length-1]:stack.pop();
    }

    oldtxt = clpDt.getData('Text');
    txt=settings.keepStck[settings.curStck]?tmpStack[tmpStack.length-1]:stack[stack.length-1];
    
      if(txt){
      copyHack(txt);
      }
    updtChromeStorage();    
  }


  /*-----------------------------------------------
  pre:keyYpPrssd(), validEl(), smrtFill()
  post: stack popped, browser.storage updated
  activate on key press. Currently, only 
  -----------------------------------------------*/
  function keysDwn(e){
    if(e && keyUpPrssd(e,settings.shrtCts.pst) && validEl(e.target, settings.pstElBList, true)){
    var txt=settings.keepStck[settings.curStck]?tmpStack[tmpStack.length-1]:stack.pop();
    window.focus();
    //console.log("paste: "+txt);
      if(typeof txt=="string"){
        if(e.target.tagName.toLocaleLowerCase()=="input"||e.target.tagName.toLocaleLowerCase()=="textarea"){
        //smrtFill(onEl, false, 'checked', flag);
        smrtFill(e.target, txt, 'value',true, true);
        }
        else if(e.target.getAttribute("contentEditable")){
        smrtFill(e.target, txt, 'contentEditable',true, true);
        }
      }
    pstSt = true;
    let sndNum=stack.length;
      if(settings.keepStck[settings.curStck]){
      sndNum=tmpStack.length.toString()+"/"+sndNum.toString();
      }
      else{
      settings["stcks"][settings.curStck]=stack.slice();
      browser.storage.local.set(settings).then((d)=>{updtSttng();});
      }
    browser.runtime.sendMessage({'num':sndNum});
    }
  }


  /*------------------------------------------------
  pre:none
  post: stack updated and browser.storage 
  what to do on selecting text, right now, copy highlight to stack
  and browser.storage
  ------------------------------------------------*/
  function mouseUpFnc(e){
  let txt=window.getSelection().toString();
    if( settings.hghlghtCp && !settings.keepStck[settings.curStck] && txt && typeof txt == "string" && txt!=""){
    stack.push(txt);
    copyHack(txt);
    browser.runtime.sendMessage({'num':stack.length});
    settings.stcks[settings.curStck]=stack;
    browser.storage.local.set(settings).then((d)=>{updtSttng();});
    }
  }

  /*------------------------------------------------
  pre:none
  post: stack updated and browser.storage 
  what to do on selecting text, right now, copy highlight to stack
  and browser.storage
  ------------------------------------------------*/
  function mouseOutFnc(e){
    if(e&&e.target&&e.target.tagName=="HTML"){
    browser.runtime.sendMessage({'syncAll':true});
    }
  }



  /*--------------------------------------------------
  pre: keyUpPrssd()
  post: updates settings, stack and/or browser.storage.local
  terminate state and do any cleanup. i.e. save to browser storage, reset tmp buffer, etc.
  --------------------------------------------------*/
  function termState(e){
    if(keyUpPrssd(e,settings.pstKeys)&&pstSt){
    //release paste key
    pstSt=false;      
      if(settings.keepStck[settings.curStck]){
      //console.log("keep stack");
      tmpStack=stack.slice();
      let sndNum=stack.length;
      sndNum=tmpStack.length.toString()+"/"+sndNum.toString();
      browser.runtime.sendMessage({'num':sndNum});
      }
      else{
      settings["stcks"][settings.curStck]=stack.slice();
      /*
      console.log("==== termState paste=====>>");
      console.log(settings);
      console.log(settings.curStck);
      console.log(stack);
      */
      browser.storage.local.set(settings).then((d)=>{updtSttng();});
      }
    }


    if(keyUpPrssd(e,settings.cpKeys)&&cpSt){
    //release copy key
    cpSt=false;
      //if keepStck is stack is set, stack in browser.storage should not be modified. don't need to update
      if(!settings.keepStck[settings.curStck]){
      settings["stcks"][settings.curStck]=stack.slice();
      /*  
      console.log("==== termState copy=====>>");
      console.log(settings);
      console.log(stack);
      */
      browser.storage.local.set(settings).then((d)=>{updtSttng();});
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
      browser.runtime.sendMessage({'num':tmpStack.length.toString()+"/"+stack.length.toString()});
       
      sendResponse(true);
      break; 
      default:
      break;
    }
  }
  
  
  updtSttng();

  document.addEventListener("mouseover", mouseOvrFnc);
  document.addEventListener("mouseup", mouseUpFnc);
  document.addEventListener("keyup", termState);
  document.addEventListener("keydown", keysDwn);
  document.addEventListener("paste", myPst);
  /*this allows, when you mouse out of a window, to send a message to the back end
  the point is to send a message to all windows and tabs to sync their settings with what's in browser.storage.
  But all that could be a lot of work considering how often people will have tons of tabs open so I'm leaving this out for now.
  let html=document.getElementsByTagName('html');
    if(html&&html.length>=1){
    html[0].addEventListener("mouseleave",mouseOutFnc);
    }
  */
  browser.runtime.onMessage.addListener(runOnMsg);
})();
