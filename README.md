library-keyri-connect - quick-start
--

1.  Serve `KeyriQR.html` from the same origin as your login page (e.g., a `/public` directory)

2.  RECOMMENDED: serve everything on your login's origin with the header `X-Frame-Options: SAMEORIGIN` (examples of how to [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options#examples))[](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options#examples)

3.  Embed an iframe in your `login` page in the desired DOM element with `./KeyriQR.html` as its `src`&#x20;

```html
      ...
      <iframe 
      src="./KeyriQR.html?__LOAD=1&__CUSTOM=2&__DATA=3&__LIKE=4&__THIS=5"
      id="qr-frame" 
      frameborder="0"
      height="300" 
      width="300" 
      scrolling="no" 
      style="border: solid 5px white;" 
    ></iframe>
    ...
    
```

4\. Add an event listener to the iframe to listen for messages from it

```javascript
  window.addEventListener("message", (evt) => {    
    // Make sure the event is one from our iFrame
    if(evt.data.keyri && evt.data.data && document.location.origin == evt.origin){

      const {data} = evt;

      // Since you're sending the data, your situation will differ,
      // but for this example, we'll store the data in localStorage and reload
      if(!data.error){
        localStorage.token = data.data.token;
        document.location.reload();
      } else {
        // Made up code...
        showErrorModal({title: "Uh Oh",body: "Helpful Error Message"});
      }
    }
  });
```
