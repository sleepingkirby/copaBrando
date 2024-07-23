
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
  browser.tabs.query({active:true, currentWindow:true},function(tabs){
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("browser")==0){
    return null;
    }
    browser.tabs.sendMessage(tabs[0].id, {action:str});
  });
}


function startListen(){
  document.getElementById("stackTA").oninput= (e) => {
    browser.storage.local.get().then((d)=>{
    d.stcks[d.curStck]=strBlck2Arr(e.target.value);
      browser.storage.local.set(d).then((e)=>{actTabMsg("update settings");});
    });
  }

  //drop down change
  document.getElementById("prflSlct").oninput= (e) => {
    browser.storage.local.get().then((d)=>{
    d.curStck=e.target.value;
      browser.storage.local.set(d).then((e)=>{
      document.getElementById("stackTA").value=arr2StrBlck(d.stcks[d.curStck]);
      document.getElementById("keepInpt").checked=d.keepStck[d.curStck];
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
        case 'input':
          if(e.target.id!=""&&e.target.name!=undefined&&e.target.name!=""){
            switch(e.target.type){
            case 'checkbox':
            var subname=e.target.getAttribute("subname");
              browser.storage.local.get().then((d)=>{
                if(subname){
                d[e.target.name][subname]=e.target.checked;
                }
                else if(e.target.name=="keepStck"){
                d[e.target.name][d.curStck]=e.target.checked;
                }
                else{
                d[e.target.name]=e.target.checked;
                }
                browser.storage.local.set(d).then((err)=>{
                  //if keepStck is turned on, make sure to tell the current page so it can
                  // set the tmpStack and set the proper badge number
                  //no need to call actTabMsg("update settings"); as "keep stack" calls it already
                  if(d.keepStck[d.curStck]){
                  actTabMsg("keep stack");
                  }
                  else{
                  actTabMsg("update settings");
                  }
                });
              });
            break;
            default:
            d[e.target.name]=e.target.value;
            browser.storage.local.set(d).then((e)=>{actTabMsg("update settings");});
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
          browser.storage.local.get(null,(d)=>{
            if(d.stcks.hasOwnProperty(nm)){
            notify('Profile not added. "'+nm+'" already exists.');
            }
            else{
            d.stcks[nm]=[];
            d.keepStck[nm]=false;
              browser.storage.local.set(d).then((e)=>{
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
          browser.storage.local.get(null,(d)=>{
          delete d.stcks[nm];
          delete d.keepStck[nm];
          var arr=Object.keys(d.stcks);
          d.curStck=arr.length>=1?arr[0]:""; 
            browser.storage.local.set(d).then((e)=>{
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
          //case 'settings':
            //browser.runtime.openOptionsPage();
          //break;
          case 'donate':
            browser.tabs.create({url: 'https://b3spage.sourceforge.io/?copaBrando'});
          break;
          default:
          break;
        }
      break;
      case "clear":
        browser.storage.local.get().then((d)=>{
        d.stcks[d.curStck]=[];
          browser.storage.local.set(d).then(()=>{
          document.getElementById("stackTA").value="";
          browser.runtime.sendMessage({'num':0});
          });
        });  
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
  if(!str || str === undefined || str == "" || typeof str != "string"){
  return str;
  }
return str.replaceAll("\n", "\\n");
}

function nlTrans(str){
  if(!str || str === undefined || str == "" || typeof str != "string"){
  return str;
  }
return str.replaceAll("\\n", "\n");
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
browser.storage.local.get().then((d) => {
  //current stack
  document.getElementById("prflSlct").innerHTML=hash2Optn(d.stcks, d.curStck);
  document.getElementById("stackTA").value=arr2StrBlck(d.stcks[d.curStck]);
  document.getElementById("keepInpt").checked=d.keepStck[d.curStck];
  document.getElementById("hghlghtCpInpt").checked=d.hghlghtCp;
  document.getElementById("pstFrmStckInpt").checked=d.pstFrmStck;
  document.getElementById("varValBool").checked=d.varValBool;

  document.getElementById("cpKeysCtrl").checked=d.cpKeys.ctrl;
  document.getElementById("cpKeysAlt").checked=d.cpKeys.alt;
  document.getElementById("cpKeysShift").checked=d.cpKeys.shift;

  document.getElementById("pstKeysCtrl").checked=d.pstKeys.ctrl;
  document.getElementById("pstKeysAlt").checked=d.pstKeys.alt;
  document.getElementById("pstKeysShift").checked=d.pstKeys.shift;
});

startListen();
