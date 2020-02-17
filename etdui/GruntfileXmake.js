module.exports = function(grunt) {

    var baseDir = "etdui/"

    // if baseDir does not ends with a '/' --> append one
    if (baseDir.indexOf("/", baseDir.length - "/".length) === -1) {
        baseDir += "/";
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        openui5_preload : {
            library: {
                options : {
                    resources : [ {
                        cwd : baseDir + "src/main/sap/secmon/ui",
                        src : [ '**/*.js', '**/*.xml', '**/*.json', '**/*.html' ],
                        prefix : 'sap/secmon/ui',
                    }],
                    compatVersion: "1.28",
                    dest : baseDir + 'build/src/main/sap/secmon/ui',
                    compress : true
                },
                libraries : {
                    'sap/secmon/ui/commons' : {
                        src: [
                            "sap/secmon/ui/commons/**"
                        ]
                    },
                    'sap/secmon/ui/m/commons' : {
                        src: [
                            "sap/secmon/ui/m/commons/**"
                        ]
                    }
                }
            },
            component : {
                options : {
                    resources : [ {
                        cwd : baseDir + "src/main/sap/secmon/ui",
                        src : [ '**/*.js', '**/*.xml', '**/*.json', '**/*.html' ],
                        prefix : 'sap/secmon/ui',
                    }],

                    dest : baseDir + 'build/src/main/sap/secmon/ui',
                    compress : true
                },
                components : {
                    'sap/secmon/ui/browse' : {
                        src: [
                            "sap/secmon/ui/browse/**"
                        ]
                    },
                    'sap/secmon/ui/m/alerts' : {
                        src : [
                            "sap/secmon/ui/m/alerts/**"
                        ]
                    },
                    'sap/secmon/ui/m/alertsfs' : {
                        src : [
                            "sap/secmon/ui/m/alertsfs/**"
                        ]
                    },
                    'sap/secmon/ui/m/semanticEventFS' : {
                        src : [
                            "sap/secmon/ui/m/semanticEventFS/**"
                        ]
                    },
                    'sap/secmon/ui/m/semanticEventViewer' : {
                        src : [
                            "sap/secmon/ui/m/semanticEventViewer/**"
                        ]
                    },
                    'sap/secmon/ui/m/valuelist' : {
                        src : [
                            "sap/secmon/ui/m/valuelist/**"
                        ]
                    },
                    'sap/secmon/ui/m/invest' : {
                        src : [
                            "sap/secmon/ui/m/invest/**"
                        ]
                    }

                }
            }
        },
        uglify: {
            min: {
                files : [{
                    expand: true,
                    cwd: baseDir + 'src/main/',
                    // uglify only non-browse ui sources as task 'openui5_preload'
                    // does a minification
                    src: ['**/*.js'],
                    dest: baseDir + 'build/src/main/'
                }]
            }
        },
        xmlmin: {
            dist: {
                options: {
                    preserveComments: false
                },
                files: [{
                    expand: true,
                    cwd: baseDir + 'src/main/',
                    src: [ '**/*.xml' ],
                    dest: baseDir + 'build/src/main/'
                }]
            }
        },
        cssmin: {
            options: {
                mergeIntoShorthands: false,
                roundingPrecision: -1
            },
            target: {
                files: [{
                    expand: true,
                    cwd: baseDir + 'src/main/',
                    src: [
                        '**/*.css'
                    ],
                    dest: baseDir + 'build/src/main/'
                }]
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: baseDir + 'src/main/',
                        src: ['**/*'],
                        dest: baseDir + 'build/src/main/',
                        rename: function(dest, src) {
                            // if the file ends with .js, .css, .xml -> put "-dbg" to the name of the file;
                            // Component.js from browse-ui is ignored otherwise debug mode does not work
                            if (src !== 'sap/secmon/ui/browse/Component.js' &&
                                    (src.endsWith(".js") || src.endsWith(".css") || src.endsWith(".xml"))
                            ) {
                                var part1 = src.substring(0, src.indexOf('.'));
                                var part2 = src.substring(src.indexOf('.'));
                                return dest + part1 + "-dbg" + part2;
                            } else {
                                return dest + src;
                            }
                        },
                        dot : true
                    },
                    // copy also test, so that tests are done on the files which are activated in hana
                    {
                        expand: true,
                        cwd: baseDir + 'src/test/',
                        src: ['**/*'],
                        dest: baseDir + 'build/src/test/'
                    },
                    // copy karma file
                    {
                        expand: true,
                        cwd: baseDir,
                        src: 'karmaXmake.conf.js',
                        dest: baseDir + 'build/'
                    }
                ]
            }
        },

        karma: {
            unit: {
                configFile: baseDir + 'karmaXmake.conf.js',
                basePath: baseDir + '/../..'
            }
        },
        compress : {
            main : {
                options : {
                    archive : 'etdui.tgz',
                    mode : 'tgz'
                },
                files : [
                    {   src : [baseDir + 'build/src/main/**'],
                        dest : '..',
                        dot : true
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-openui5');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-xmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['openui5_preload','uglify','xmlmin','cssmin','copy','karma', 'compress']); // Default task(s).
};
