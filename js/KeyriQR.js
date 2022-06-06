
//
// Little class to help with the conversion of data into QRCodes, and
// putting the QRCodes into images
//
class KeyriQR {

  // Private instance of the actual QR Library 
  #AwesomeQR;
  #cache = {};

  // ////////////////////////////////////////////////////////////////////////
  constructor() {
    this.#AwesomeQR = AwesomeQR;
  }

  // ////////////////////////////////////////////////////////////////////////
  imageToBase64(t) {
    return new Promise(((e, r) => {
      var o = document.createElement("canvas"),
        n = document.createElement("img");

      n.setAttribute('crossorigin', 'anonymous');

      n.onload = function (t) {

          return o.height = n.naturalHeight,
            o.width = n.naturalWidth,
            o.getContext("2d").drawImage(n, 0, 0, o.width, o.height),
            e(o.toDataURL())
        },
        n.src = t
    }))
  }
  
  
  // ////////////////////////////////////////////////////////////////////////
  makeQrData = async (text, img) => {


    // Set up our default options
    let options = {
      "text": text,
      "size": 1500,
      "logoScale": .3,
      "correctLevel": 3,
      "dotScale": 0.7,
      "colorDark": "#595959"
    };

    // If they give us an "img" in the args, we need to convert it
    // to base64
    if (img) {
      
      //
      // Cache
      //
      if(localStorage){
        if(localStorage.logoImage){
          options.logoImage = localStorage.logoImage;
        } else {
          options.logoImage = await this.imageToBase64(img);
          localStorage.logoImage = options.logoImage;
        }
      } else {
        options.logoImage = await this.imageToBase64(img);
      }
    }

    // Let AwesomeQR make a QRCode image; base64 it, and we
    // set it as "src" for the given target...neat, huh...*yawns*
    //
    return await new this.#AwesomeQR.AwesomeQR(options)
      .draw()
      .then((dataURL) => {
        return dataURL;
      });
      
  }
}
