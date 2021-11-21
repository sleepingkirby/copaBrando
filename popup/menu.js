
function actTabUpdt(){
  chrome.tabs.query({active:true, currentWindow:true},function(tabs){
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("chrome")==0){
    console.log("null");
    return null;
    }
    chrome.tabs.sendMessage(tabs[0].id, {action:"update settings"});
  });
}


function startListen(){
  document.addEventListener("click", (e) => {
  var d={};
    switch(e.target.getAttribute("act")){
      case "updt":
        switch(e.target.tagName.toLocaleLowerCase()){
        case 'textarea':
        d={'stcks':{}};
        d.stcks[document.getElementById("prflSlct").value]=strBlck2Arr(document.getElementById("stackTA").value);
          chrome.storage.local.set(d, (e)=>{});
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
              chrome.storage.local.set(d, (err)=>{actTabUpdt();});
              });
            break;
            default:
            d[e.target.name]=document.getElementById(e.target.id).value;
            chrome.storage.local.set(d, (e)=>{actTabUpdt();});
            break;
            }
          }
        break;
        default:
        break;
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
