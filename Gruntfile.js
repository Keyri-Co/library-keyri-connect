var fs = require("fs");


module.exports = function(grunt){
  grunt.initConfig({
    "pkg": "package.json",
    "uglify": {
      "options": {
        "sourceMap": true,
        "beautify": false,
        "mangle": true
      },
      "my_target": {
        "files": {
          "dist/keyri-0.10.1.min.js": ["js/AwesomeQR.js","js/EZCrypto.js","js/KeyriQR.js","js/SimpleSocket.js","js/main.js"]
        }
      }
    }
  });




    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", [
        "uglify"
    ]);



}