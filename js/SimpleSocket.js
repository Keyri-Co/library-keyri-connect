class SimpleSocket extends KeyriQR{

  #radio;
  
  #socket;
  #socket_url;
  #queryStringData
  #cryptKeys
  
  #imgArray = [];
  #CryptKeeper = new EZCrypto();
  
  
  #mobileConnect = false;
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  constructor(origin, env = "prod", queryStringData, cryptKeys) {
    
    super();

    this.#radio = document.createDocumentFragment();

    //
    // Foot Gun Protection Here:
    // Try to make sure someone isn't siphoning our iFrame.
    // In production, the server should serve with `x-frame-options: sameorigin`
    // but just in case that doesn't happen - let's squib and hari-kari
    // rather than letting our QR code slide through
    //
    //
    try{
      let tmp = top.location.host;
    } catch(e){
      let errMsg = "iframe host must be the same as page host. Set x-frame-options to 'sameorigin' to prevent this message in the future";
      this.#broadcast("ERROR", true);
      throw new Error(errMsg);
    }
    
    if (top.location.host !== self.location.host) {
      throw new Error("iframe host must be the same as page host\n set x-frame-options to 'sameorigin' to prevent this message in the future");
    } else {

      this.#socket_url = `wss://${env}.socket.keyri.com`;

      if (origin) {
        this.#socket_url = this.#socket_url + `?Origin=${origin}`;
      }

      if (queryStringData) {
        this.#queryStringData = queryStringData;
      }

      if (cryptKeys) {
        this.#cryptKeys = cryptKeys;
      }

    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  connect = async() => {
    
    //
    // Create Crypto Keys here...
    // This makes more sense than forcing the outside world to do it...?
    //
    if(!this.#cryptKeys){
      this.#cryptKeys = await this.#CryptKeeper.EcMakeCryptKeys(false);
    }

    return new Promise((s, j) => {

        this.#socket = new WebSocket(this.#socket_url);
        this.#socket.onmessage = this.#onmessage;
        this.#socket.onopen = this.#onopen;
        this.#socket.ondisconnect = this.#ondisconnect;
        this.#socket.onclose = this.#onclose;

        //
        // .... do something useful 
        //
        this.on("WIDGET_INIT", async (e) => {
          await this.#widget_init(e);
          clearTimeout(timeOutMain);
          s(true);
        });
        
        //
        // .... when mobile connects to us,
        //      clear our imgArray
        //
        this.on("MOBILE_CONNECT", (e) => {
          this.#imgArray = [];
          this.#mobileConnect = true;
        });
        

        //
        // .... or hang in 5 seconds
        //
        let timeOutMain = setTimeout(() => {
          j(false);
        },5_000)
    });

  }
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  on = (t, e) => {
    this.#radio.addEventListener(t, e)
  };

  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // Internal method to broadcast custom events when needed
  //
  #broadcast = (t, e) => {
    this.#radio.dispatchEvent(new CustomEvent(t, {
      detail: e
    }))
  };
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // When our socket gets a message, broadcast to all listeners
  //
  #onmessage = t => {
    let e = JSON.parse(t.data);
    if(e.action){
      this.#broadcast(e.action, e)
    } else {
      console.error("NO `action` SET ON RETURN OBJECT. FAIL!", e, this);
    }
  };
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  #ondisconnect = t => {
    console.log(t)
  };


  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  #onclose = t => {
    console.log(t)
  }

  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  get qr64(){
    return this.#imgArray.shift();
  }
  
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  //
  // When socket opens, send a message to server to "WIDGET_INIT"
  #onopen = async (t) => {

    // Make sure our websocket is open and ready to listen
    // before proceeding
    var retryCount = 0;
    while (this.#socket.readyState != 1 && retryCount < 6) {
      await new Promise((resolve) => {
        setTimeout(() => {
          retryCount++;
          console.log({
            retryCount
          });
        }, 200)
      });
    }

    // Send data through the websocket to the server
    this.#socket.send(JSON.stringify({
      "action": "WIDGET_INIT",
      "userParameters": this.#queryStringData,
      "browserPublicKey": this.#cryptKeys.rawPublicKeyLite
    }));

  };
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // Here, we create a bunch of QR codes and store them as base64 images
  // in our array...
  // 
  #widget_init = async (evt) => {

    let data = evt.detail;
    let out = evt.detail.WidgetOrigin.replace(/^.*\//, "").replaceAll(".", "-");
    this.#imgArray = data.sessionIds.map((id) => {return `https://${out}.onekey.to?sessionId=${id}`});
    this.#imgArray = await Promise.all(this.#imgArray.map((x) => {return this.makeQrData(x,data?.logo)}));
    this.#shareImages();
    return true;
  }
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // Here, we pump the QR-Images out to an event listener every 15 seconds
  // 
  #shareImages = async () => {
    
    let b64;
    
    // Loop with a wait...
    while(b64 = this.qr64){
      this.#broadcast("QR_LOAD", b64);
      await new Promise((s,j) => {setTimeout(() => {s(true)},15_000)});
    }
    
    // If we never connected, broadcast qr-queue is empty AF
    if(!this.#mobileConnect){
      this.#broadcast("QR_EMPTY", true);
    }
    
  }
  
  
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////
  // Here, we create a bunch of QR codes and store them as base64 images
  // in our array...
  // 
  decrypt = async(data) => {
    const decoder = new TextDecoder();
    const {publicKey, salt, iv, ciphertext} = data;
    const plainText = await this.#CryptKeeper.HKDFDecrypt(this.#cryptKeys.privateKey, publicKey, salt, iv, ciphertext);
    return decoder.decode(plainText);
  }
  

}