// Karma configuration
// Generated on Wed Oct 15 2014 14:32:59 GMT+0200 (W. Europe Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    client: {
        jasmine: {
          random: false,
          stopOnFailure: false,
          failFast: true,
          timeoutInterval: 300
        }
      },


    // list of files / patterns to load in the browser
    files: [
        'http://localhost:9876/sap/ui5/1/resources/sap-ui-core.js',
        'src/test/setup.js',
      {
        pattern : 'src/main/**/*.js',
        included : false
      },
      {
          pattern : 'src/test/TestHelper.js',
          included : false
        },

      'src/test/**/*Test.js'
    ],


    // list of files to exclude
    exclude: [
    ],


     // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'junit', 'html', 'spec'],

    // the default configuration
    junitReporter: {
      outputFile: 'build/test-results.xml',
      suite: ''
    },

    htmlReporter: {
      outputDir: 'build', // where to put the reports
      templatePath: null, // set if you moved jasmine_template.html
      focusOnFailures: true, // reports show failures on start
      namedFiles: false, // name files instead of creating sub-directories
      pageTitle: null, // page title for reports; browser info by default
      urlFriendlyName: false // simply replaces spaces with _ for files/dirs
    },


    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher',
      'karma-html-reporter',
      'karma-spec-reporter',
      'karma-junit-reporter'
    ],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    captureTimeout : 60000,
    browserDisconnectTimeout : 2000,
    browserDisconnectTolerance : 0,
    browserNoActivityTimeout : 60000,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    proxyValidateSSL : false,
    proxies:  {
      '/sap/ui5/1/resources/': "https://ld3796.wdf.sap.corp:4300/sap/ui5/1/resources/"
    },
  });
};
