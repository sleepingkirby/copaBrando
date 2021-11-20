


function startListen(){
  document.addEventListener("click", (e) => {
  var d={};
    if(e.target.getAttribute("action")=="updt"){
      switch(e.target.tagName){
      case 'textarea':
      d={'stcks':{}};
      d.stcks[document.getElementById("prflSlct").value]=document.getElementById("stackTA").value;
        chrome.storage.local.set(d, (e)=>{});
      break;
      default:
        if(e.target.id!=""&&e.target.name!=undefined&&e.target.name!=""){
        d[e.target.name]=document.getElementById(e.target.id).value;
        chrome.storage.local.set(d, (e)=>{console.log(e);});
        }
      break;
      }
    }
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
  console.log("------------------------>>");
  console.log(d.stcks);
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
