// Karma configuration
// Generated on Wed Oct 15 2014 14:32:59 GMT+0200 (W. Europe Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    
  client: {
      jasmine: {
        random: false,
        stopOnFailure: false,
        failFast: true,
        timeoutInterval: 300,
        throwOnExpectationFailure  : true
      }
    },


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    autowatch : false,
    // list of files / patterns to load in the browser
    files: [
        'resources/sap-ui-core.js',
        'etdui/build/src/test/setup.js',
      {
            pattern : 'resources/**/*',
            included : false,
            nocache : false,
            served : true,
            watched : false,
            served : true
       },
       {
           pattern : 'resources/*',
           included : false,
           nocache : true,
           served : true,
           watched : false,
           served : true
      },       
      {
        pattern : 'etdui/build/src/main/**/*.js',
        nocache : false,
        included : false,
        watched : false,
        served : true
      },
      {
          pattern : 'etdui/build/src/test/TestHelper.js',
          included : true,
          watched : false
        },
       {
           pattern : 'etdui/build/src/test/**/*Test.js',
           included : true,
           nocache : true,
           served : true,
           watched : false
        }
            
    ],


    // list of files to exclude
    exclude: [
    ],


     // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'html', 'spec', 'junit', 'coverage'],

    // the default configuration
    junitReporter: {
      outputDir: 'etdui/build', 
      outputFile: 'test-results.xml',
      suite: ''
    },

    htmlReporter: {
      outputDir: 'etdui/build', // where to put the reports
      templatePath: null, // set if you moved jasmine_template.html
      focusOnFailures: true, // reports show failures on start
      namedFiles: false, // name files instead of creating sub-directories
      pageTitle: null, // page title for reports; browser info by default
      urlFriendlyName: false // simply replaces spaces with _ for files/dirs
    },
    preprocessors : {
        'etdui/build/src/main/sap/secmon/ui/**/*.js' : ['coverage']
    },
    coverageReporter : {
        type : 'cobertura',
        dir : 'etdui/build',
        reporters : [{type : 'cobertura', subdir : 'cobertura'}],
        includeAllSources : true
    },



    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher2',
      'karma-html-reporter',
      'karma-spec-reporter',
      'karma-junit-reporter',
      'karma-coverage'
    ],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: false,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


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

    proxies:  {
      '/sap/ui5/1/resources/': '/base/resources',
      '/base/src/' : '/base/etdui/build/src/',
      '/sap/' : '/base/etdui/build/src/main/sap/'
    },
  });
};
