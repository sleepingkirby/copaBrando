
function notify(str){
let el=document.getElementsByClassName('notify')[0];
el.id="";
el.textContent=str;
el.id="fadeOut";
  el.addEventListener("animationend", ()=>{
  el.id='';
  });
}

function actTabMsg(str){
  chrome.tabs.query({active:true, currentWindow:true},function(tabs){
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("chrome")==0){
    console.log("null");
    return null;
    }
    chrome.tabs.sendMessage(tabs[0].id, {action:str});
  });
}


function startListen(){
  var el=document.getElementById("stackTA");
  el.oninput=function(e){
    chrome.storage.local.get(null, (d)=>{
    d.stcks[d.curStck]=strBlck2Arr(el.value);
      chrome.storage.local.set(d,(e)=>{actTabMsg("update settings");});
    });
  }

  //drop down change
  document.getElementById("prflSlct").oninput=function(e){
    chrome.storage.local.get(null, (d)=>{
    console.log(d);
    d.curStck=e.target.value;
      chrome.storage.local.set(d, (e)=>{
      actTabMsg("update settings");
      });
    });
  }

  document.addEventListener("click", (e) => {
  var d={};
  var nm=null;
    switch(e.target.getAttribute("act")){
      case "updt":
        switch(e.target.tagName.toLocaleLowerCase()){
        case 'textarea':
        d={'stcks':{}};
        d.stcks[document.getElementById("prflSlct").value]=strBlck2Arr(document.getElementById("stackTA").value);
          chrome.storage.local.set(d, (e)=>{actTabMsg("update settings");});
        break;
        case 'input':
          if(e.target.id!=""&&e.target.name!=undefined&&e.target.name!=""){
            switch(e.target.type){
            case 'checkbox':
            var subname=e.target.getAttribute("subname");
              chrome.storage.local.get(null, (d)=>{
                if(subname){
                d[e.target.name][subname]=document.getElementById(e.target.id).checked;
                }
                else{
                d[e.target.name]=document.getElementById(e.target.id).checked;
                }
                chrome.storage.local.set(d, (err)=>{
                  //if keepStck is turned on, make sure to tell the current page so it can
                  // set the tmpStack and set the proper badge number
                  //no need to call actTabMsg("update settings"); as "keep stack" calls it already
                  if(d.keepStck){
                  actTabMsg("keep stack");
                  }
                  else{
                  actTabMsg("update settings");
                  }
                });
              });
            break;
            default:
            d[e.target.name]=document.getElementById(e.target.id).value;
            chrome.storage.local.set(d, (e)=>{actTabMsg("update settings");});
            break;
            }
          }
        break;
        default:
        break;
        }
      break;
      case "addPrfl":
      nm=document.getElementById("newPrfl").value;
        if(nm&&nm!=""&&nm!=null&&nm!=undefined){
          chrome.storage.local.get(null,(d)=>{
            if(d.stcks.hasOwnProperty(nm)){
            notify('Profile not added. "'+nm+'" already exists.');
            }
            else{
            d.stcks[nm]=[];
            console.log(d);
            console.log(d.stcks);
              chrome.storage.local.set(d,(e)=>{
              notify('Profile: "'+nm+'" added.');
              document.getElementById("prflSlct").innerHTML=hash2Optn(d.stcks, d.curStck);
              actTabMsg("update settings");
              });
            }
          });
        }
      break;
      case "delPrflMod":
      //opens up the "are you sure you want to delete this profile?" modal
      let el=document.getElementById("delPrflMod")
      el.firstElementChild.innerText='"'+document.getElementById("prflSlct").value+'"';
      el.style.display="flex";
      break;
      case "cnclDelPrflMod":
      //removes the above modal
      document.getElementById("delPrflMod").style.display="none";
      break;
      case "delPrfl":
      nm=document.getElementById("prflSlct").value;
        if(nm&&nm!=""&&nm!=null&&nm!=undefined){
          chrome.storage.local.get(null,(d)=>{
          delete d.stcks[nm];
          var arr=Object.keys(d.stcks);
          d.curStck=arr.length>=1?arr[0]:""; 
          console.log(d);
            chrome.storage.local.set(d,(e)=>{
            document.getElementById("prflSlct").innerHTML=hash2Optn(d.stcks, d.curStck);
            notify('Profile: "'+nm+'" deleted.');
            document.getElementById("delPrflMod").style.display="none";
            actTabMsg("update settings");
            });
          });
        } 
      break;
      case "openLink":
        switch(e.target.name){
          case 'settings':
            chrome.runtime.openOptionsPage();
          break;
          case 'donate':
            chrome.tabs.create({url: 'https://b3spage.sourceforge.io/?copaBrando'});
          break;
          default:
          break;
        }
      break;
      default:
      break;
    }
  });
}


function hash2Optn(hsh, slct){
  if(!hsh || hsh === null || typeof hsh !== "object"){
  return false;
  }

var rtrn="";
  for(i in hsh){
    if(i==slct){
    rtrn+='<option value="'+i+'" selected>'+i+'</option>';
    }
    else{
    rtrn+='<option value="'+i+'">'+i+'</option>';
    }
  }
return rtrn;
}

function transNL(str){
return str.replaceAll("\n", '\\n');
}

function nlTrans(str){
return str.replaceAll('\\n', "\n");
}

function arr2StrBlck(arr){
var rtrn="";
  if(!arr || arr === null || typeof arr !== "object"){
  return rtrn;  
  }
var b="";
  for( i in arr){
  rtrn+=b+transNL(arr[i]);
  b="\n";
  }
return rtrn;
}

function strBlck2Arr(str){
  if(!str || str=="" || typeof str!="string"){
  return [];
  }
return str.split("\n");
}


//set the checkbox from the config
chrome.storage.local.get(null,(d) => {
  //current stack
  document.getElementById("prflSlct").innerHTML=hash2Optn(d.stcks, d.curStck);
  document.getElementById("stackTA").value=arr2StrBlck(d.stcks[d.curStck]);
  document.getElementById("keepInpt").checked=d.keepStck;

  document.getElementById("cpKeysCtrl").checked=d.cpKeys.ctrl;
  document.getElementById("cpKeysAlt").checked=d.cpKeys.alt;
  document.getElementById("cpKeysShift").checked=d.cpKeys.shift;

  document.getElementById("pstKeysCtrl").checked=d.pstKeys.ctrl;
  document.getElementById("pstKeysAlt").checked=d.pstKeys.alt;
  document.getElementById("pstKeysShift").checked=d.pstKeys.shift;
});

startListen();
