module.exports = function(grunt) {

    var baseDir = 'gitRepo/etdui/';
    
    // if baseDir does not ends with a '/' --> append one
    if (baseDir.indexOf("/", baseDir.length - "/".length) === -1) {
        baseDir += "/";
    }
    console.log(baseDir);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
         karma: {
            unit: {
                configFile: baseDir + 'karmaTest.conf.js'
            }
        }
    });

      grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['karma']); // Default task(s).
};
