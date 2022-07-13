//
// Import our socket handler to communicate with the Keyri API
//
async function main(){
  
  if(window.socket){
    window.socket.kill();
    delete window.socket;
  }
  
  window.socket = {};


  //
  // In order to *SAFELY* communicate with the parent frame, you need to know
  // who you're talking to.
  //
  // We're setting this on the querystring on the 
  if(!document?.currentScript?.src){
    let TARGET_ORIGIN = null;
  } else {
    let url = new URL(document.currentScript.src);
    let TARGET_ORIGIN = url.searchParams.get("TARGET_ORIGIN")
  }


  //
  // To prevent other sites from click-jacking this iframe, here is some boiler
  // plate javascript that should cause this script to not load / fail
  // if not loaded from within your domain.
  //
  // https://stackoverflow.com/questions/27358966/how-to-set-x-frame-options-on-iframe
  // https://seclab.stanford.edu/websec/framebusting/framebust.pdf
  try{
    let tmp = top.location.host;
  } catch(e){
    throw new Error("ORIGIN OF IFRAME MUST BE THE SAME AS HOST.");
  }

//  if(TARGET_ORIGIN == null){
    TARGET_ORIGIN = location.origin;
//  }
  
  if(TARGET_ORIGIN !== parent.location.origin){
    throw new Error("THE ORIGIN OF THE PARENT FRAME AND THE URL GIVEN IN THE QUERY STRING MUST MATCH!");
    console.log(TARGET_ORIGIN, parent.location.origin);
  }

  
  //
  // The developer (you, reading this) can pass extra information from the browser
  // to the mobile by putting it in the querystring of the iframe's `src` attr.
  //
  // Mobile will recieve this information in its response from the GET call to the API.
  // It will be on an attribute called `userParameters`
  //
  let queryStringData = Object.fromEntries(Array.from((new URL(document.location)).searchParams));
  let queryStringDataJs = {};
  
  if(document?.currentScript?.src){
    queryStringDataJs = Object.fromEntries(Array.from((new URL(document.currentScript.src)).searchParams));
  }

  //
  // Merge any query string data from the iframe or the js src
  //
  queryStringData = Object.assign(queryStringData, queryStringDataJs);

  //
  // Create references to obects on the page we'll need to update.
  // `qrTarget` is an `img` tag where we'll put the actual QR data
  // `qrLayOver` is an empty div that we can manipulate when events occur
  //
  const qrTarget = document.querySelector("#qr-target");
  const qrLayOver = document.querySelector("#qr-lay-over");
  
  //
  // Pre-emptive use clean up
  //
  qrLayOver.classList.remove("check");
  qrLayOver.classList.remove("reload");
  qrLayOver.classList.remove("bad");

  //
  // Instantiate the socket and wait for it to connect and make QR codes
  //
  window.socket = new SimpleSocket(
    queryStringData?.Origin, 
    queryStringData?.Environment, 
    queryStringData
  );
 
  //
  // EVENT LISTENER: MOBILE_CONNECT
  // ---------------------------------------------
  // Whenever socket emmits the event "MOBILE_CONNECT",
  // we want to stop cycling through QR Codes...AND!
  // we want to blur the current QR code out and put an icon
  // it or whatever...
  //
  socket.on("MOBILE_CONNECT", (data) => {
    qrTarget.classList.add("blurry");
    qrLayOver.classList.add("check");
  });
  
 
  //
  // EVENT LISTENER: QR_EMPTY
  // ---------------------------------------------
  // If we've exhausted our QR queue, socket emits this event
  // let's put on the reload picture or whatever.
  //
  socket.on("QR_EMPTY", (data) => {
    qrTarget.classList.add("blurry");
    qrLayOver.classList.add("reload");
  });
  
  
  //
  // EVENT LISTENER: SESSION_VALIDATE
  // ---------------------------------------------
  // Whenever data has made a full cycle and is now back to the browser
  // The socket will emit a "SESSION_VALIDATE" event.
  //
  // We will take this data, decrypt it, and pump it up (like you don't even need it)
  // to the main frame...
  //
  // TODO: Put this in SimpleSocket and emit something else
  
  socket.on("SESSION_VALIDATE", async (data) => {
    const plainText = await socket.decrypt(data.detail.browserData);
    window.parent.postMessage({data: plainText, keyri: true, error: false}, TARGET_ORIGIN);
  });


  //
  // EVENT LISTENER: QR_LOAD
  // ---------------------------------------------
  // This event contains the base64 encoded QR-Image, and
  // comes around every 15 seconds or so. When we hear it,
  // we'll set the `src` of our QR-Target
  socket.on("QR_LOAD", async (data) => {
    qrTarget.classList.remove("blurry");
    qrTarget.classList.remove("pre-blurry");
    qrTarget.src = data.detail
  });
  
  //
  // EVENT LISTENER: ERROR
  // ---------------------------------------------
  // Unfortunately, we need to think about these too...
  // we'll push this up to the main-frame to get handled
  socket.on("ERROR", async (data) => {
    // Clear any old junk that's accumulated
    qrLayOver.classList.remove("check");
    qrLayOver.classList.remove("reload");
    
    // Blur and add our BAD svg over the QR
    qrTarget.classList.add("blurry");
    qrLayOver.classList.add("bad");
    console.log(data.detail);
    window.parent.postMessage({data: data.detail, keyri: true, error: true}, TARGET_ORIGIN);
  });
  
  
  await socket.connect();
}

main();