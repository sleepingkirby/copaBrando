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


  document.addEventListener("mouseover", mouseOvrFnc);
console.log("====================>>");
  
  //chrome.runtime.onMessage.addListener(runOnMsg);
})();




