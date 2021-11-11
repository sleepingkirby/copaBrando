
function startListen(){
  document.addEventListener("click", (e) => {
    switch(e.target.name){
      case 'settings':
        chrome.runtime.openOptionsPage();
      break;
      case 'donate':
        chrome.tabs.create({url: 'https://b3spage.sourceforge.io/?butWhyMod'});
      break;
      default:
      break;
    }
  });

}



//set the checkbox from the config
chrome.storage.local.get(null,(item) => {
});
