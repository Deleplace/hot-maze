
// Those are a few hundred lines of highly questionable JS.
// They are not representative of state-of-the-art frontend practices.


// Workflow B3: use Cloud Storage.
//
// 1) The page displays a File input/Drag'n'drop zone
// 2) The User drops a file F
// 4) The page asks the backend for a Signed URLs U, D
// 5) The page uploads F to U
// 6) The page encodes and displays D inside a QR-code
// 7) The user scans the QR-code with their mobile
// 8) The mobile downloads F at URL D

// var backend = "https://hot-maze.uc.r.appspot.com";
// Frontend and Backend hosted at the same domain on App Engine.
var backend = ""; 

let resourceFile;
let qrText;

function showError(errmsg) {
  console.log("Error: " + errmsg)
  clearQR();
  freezeResize();
  errorZone.innerHTML = errmsg;
  errorZone.style.display = "block";
  return false;
}

let qrHundredth = 40;

function render(colorDark, clickCallback){
  // qrHundredth == 95 is a "big QR-code" (almost fullscreen)
  // qrHundredth == 50 is a "medium-size QR-code"

  // -50 is for the small [?] box on the left
  var w = Math.max(document.documentElement.clientWidth -50, (window.innerWidth || 0) -50) * qrHundredth / 100;
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * qrHundredth / 100;
  var c = 400;
  if ( w>0 )
    c = w;
  if ( h>0 && h<c )
    c = h;

  clearQR();
  console.log("Rendering QR data ", qrText);
  console.debug(`${qrText.length} characters`);
  // The limit seems to be 2328 characters.
  // If the qrText exceeds, we get TypeError: Cannot read property '1' of undefined
  try {
    new QRCode("qrcode", {
      text: qrText,
      width: c,
      height: c,
      colorDark : colorDark,
      colorLight : "white",
      correctLevel : QRCode.CorrectLevel.M
    });
  } catch(e) {
    showError("Could not render QR-code: " + e);
    return;
  }

  // The QR-code contents is clickable to embiggen, not the whole qr-zone
  if (clickCallback)
    for(var i=0; i < qrcode.childNodes.length; i++)
      qrcode.childNodes[i].onclick = clickCallback;
}

// Go fullscreen -> bigger QR
var resizeTimeOut = null;
window.onresize = function(){
    if (resizeTimeOut != null)
        clearTimeout(resizeTimeOut);
    resizeTimeOut = setTimeout(function(){
        if(qrText) {
          render("black", embiggen);
        }
    }, 300);
};
function freezeResize(){
  // after scan, or on fatal error, we don't need/want to
  // redisplay a fresh black QR-code again.
  window.onresize = function(){ return false; }
}

function clearQR() {
  var node = qrcode;
  while (node.firstChild) {
      node.removeChild(node.firstChild);
  }
}

questionMark.onclick = function(event) { 
    if ( helpContents.style.display === "none" ){
      helpContents.style.display = "block";
      questionMark.style.display = "none";
    }
}
helpClose.onclick = function(event) { 
    helpContents.style.display = "none";
    questionMark.style.display = "";
}
document.onkeydown = function(evt) {
  evt = evt || window.event;
  var isEscape = false;
  if ("key" in evt) {
    isEscape = (evt.key == "Escape" || evt.key == "Esc");
  } else {
    isEscape = (evt.keyCode == 27);
  }
  if (isEscape) {
    questionMark.style.display = "";
    helpContents.style.display = "none";
  }
};

function embiggen(event) { 
    // Change size on each click
    // 40, 68, 96, 40, 60, 96 ...
    qrHundredth += 28;
    if ( qrHundredth>100 )
      qrHundredth = 40;
    render("black", embiggen);
}

function displayGetQrCode() {
  formZone.style.display = "none";
  animShow(qrZone, 800);
  render("black", embiggen);

  let minutesAvailable = 9;  // Expires after 9mn
  let expi = new Date(new Date().getTime() + minutesAvailable*60000);
  let hh = expi.getHours();
  let mm = ('0'+expi.getMinutes()).slice(-2);
  let displayExpi = `${hh}:${mm}`;
  expirationZone.innerHTML = `
    <p>Resource will be available for a few minutes only.</p>
    <p>It will expire at ${displayExpi}.</p>
  `;
  window.setTimeout( () => {
    qrcode.style.visibility = 'hidden';
    expirationZone.innerText = `Resource has expired.`
  }, minutesAvailable*60000);
}

function processResourceFile() {
   // Here, resourceFile has been set either through the file select input,
   // or through a drag'n'drop.
   // What happens next with resourceFile is the same in both use cases.

   requestGcsUrls()
    .catch(showError)
    .then(doUpload)
    .catch(showError)
    .then(progressSuccess)
    .then(displayGetQrCode);
}

resourceInput.onchange = function(e) { 
    resourceFile = resourceInput.files[0];
    processResourceFile();
};

function handleDnd(){
  // See https://css-tricks.com/drag-and-drop-file-uploading/
  var div = document.createElement('div');
  var dndFileSupported = (('draggable' in div) 
    || ('ondragstart' in div && 'ondrop' in div)) 
    && 'FormData' in window && 'FileReader' in window;
  if (!dndFileSupported)
    return;

  dropInvite.style.display = "block";

  var dropZone = resourceUpload;

  function highlightDropZone(){
    dropZone.style.border = 'red dotted 10px';
  }

  function unhighlightDropZone(){
    dropZone.style.border = 'rgba(255, 255, 255, 0) solid 10px';
  }

  dropZone.addEventListener('dragover', function(evt){
    evt.stopPropagation();
    evt.preventDefault();
    highlightDropZone()
    evt.dataTransfer.dropEffect = 'copy';
  }, false);

  dropZone.addEventListener('drop', function(evt){
    evt.stopPropagation();
    evt.preventDefault();
    helpContents.style.display = "none";
    unhighlightDropZone();

    var files = evt.dataTransfer.files;
    if( files.length>1 ){
      showError("Multiple upload not supported (yet)");
      return;
    }

    // Upload 1st file only.
    resourceFile = files[0];
    processResourceFile();
  }, false);

  dropZone.addEventListener('dragleave', function(evt){
    unhighlightDropZone();
  }, false);
}

async function requestGcsUrls() {
  console.debug("requestGcsUrls");
  animHide(fileForm, 400);
  uploadProgress.style.display = "inline";
  uploadProgress.value = 0.02;
  animShow(uploadProgress, 600);

  let endpoint = `${backend}/secure-urls`;
  let params = `filetype=${encodeURIComponent(resourceFile.type)}`
               + `&filesize=${resourceFile.size}`
               + `&filename=${encodeURIComponent(resourceFile.name)}`;
  let url = `${endpoint}?${params}`;
  return fetch(url, {method:"POST"})
    .then( async response => {
        if(!response.ok) {
          throw new Error(`Code ${response.status} - ${await response.text()}`);
        }
        return response.json();
      })
    .catch(showError);
}

async function doUpload(gcsUrls) {
  console.debug("URL GET =", gcsUrls.downloadURL);
  qrText = gcsUrls.downloadURL;
  console.debug("URL PUT =", gcsUrls.uploadURL);
  uploadProgress.style.display = "inline";
  uploadProgress.value = 0.05;

  // XMLHttpRequest instead of fetch: be cause we use
  // the 'progress' event.
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", gcsUrls.uploadURL);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    (xhr.upload || xhr).addEventListener('progress', function(e) {
        var done = e.position || e.loaded;
        var total = e.totalSize || e.total;
        var ratio = done/total;
        console.debug("Upload ratio:", ratio);
        uploadProgress.value = 0.05 + 0.85*ratio;
    });
    xhr.setRequestHeader("Content-Type", resourceFile.type);
    if(resourceFile.name) {
      xhr.setRequestHeader("Content-Disposition", `filename="${encodeURIComponent(resourceFile.name)}"`);
    }
    xhr.send(resourceFile);
  });
}

async function progressSuccess() {
  uploadProgress.value = 1;
  animHide(uploadProgress, 1500)
}

function animShow(element, duration) {
  duration = duration || 300;
  element.animate([
    { opacity: 0 }, 
    { opacity: 1 } 
  ], { 
    duration: duration,
    easing: "ease-in-out",
    fill: "forwards"
  });
}

function animHide(element, duration) {
  duration = duration || 300;
  element.animate([
    { opacity: 1 }, 
    { opacity: 0, display: "none" } 
  ], { 
    duration: duration,
    easing: "ease-in-out",
    fill: "forwards"
  });
}


//
// Let's start: init, then wait for user file selection.
//

handleDnd();