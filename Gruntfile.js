var fs = require("fs");
var version = "0.10.1";

var configObj = {
    "pkg": "package.json",
    "uglify": {
      "options": {
        "sourceMap": true,
        "beautify": false,
        "mangle": true
      },
      "my_target": {
        "files": {
          "dist/XXX.min.js": ["js/AwesomeQR.js","js/EZCrypto.js","js/KeyriQR.js","js/SimpleSocket.js","js/main.js"]
        }
      }
    }
  }
  
// GANK IT UP!
configObj.uglify.my_target.files[`dist/keyri-${version}.min.js`] = configObj.uglify.my_target.files["dist/XXX.min.js"];
delete configObj.uglify.my_target.files["dist/XXX.min.js"];

console.log(configObj.uglify.my_target)


module.exports = function(grunt){
  
  grunt.initConfig(configObj);
  grunt.task.registerTask("timestamp","what", function(){
    
    var done = this.async();
    setTimeout(function() {
      console.log("WRITING!");
      fs.appendFile(`dist/keyri-${version}.min.js`, `\n\n\n console.log("SCRIPT COMPILED: ${new Date().toString()} ");`, (err, data) => {
            grunt.log.writeln('WROTE');
            grunt.log.writeln(new Date())
            done();
      })
      
    }, 2000);
  })





  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.registerTask("default", [
      "uglify",
      "timestamp"
  ]);



}