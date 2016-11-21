module.exports = function(config){

    var browsers, basePath, coverageReporter;

    var additionalDependencies;
    if(process.env.TRAVIS){
        browsers = ["Firefox"];
        basePath = '/home/travis/virtualenv/python2.7/src/opal/opal/static/js';
        coverageReporter = {
            type: 'lcovonly', // lcov or lcovonly are required for generating lcov.info files
            dir: __dirname + '/../coverage/',
        };
        additionalDependencies = require('/home/travis/virtualenv/python2.7/src/opal/config/karma_dependencies.js');
    }
    else{
        browsers = ['PhantomJS'];
        basePath = '../../opal/opal/static/js';
        coverageReporter = {
            type : 'html',
            dir : __dirname + '/../htmlcov/js/'
        };
        additionalDependencies = require('../../opal/config/karma_dependencies.js');
    }

    var preprocessors = {};
    preprocessors[__dirname + '/../pathway/static/js/pathway/**/*.js'] = 'coverage';

    config.set({
        frameworks: ['jasmine'],
        browsers: browsers,
        basePath: basePath,
        files: additionalDependencies().concat([
          __dirname + '/../pathway/static/js/pathway/**/*.js',
          __dirname + '/../pathway/static/js/pathwaytest/*.js'
        ]),

        preprocessors: preprocessors,

        reporters: ['progress', 'coverage'],
        autoWatch: true,

        coverageReporter: coverageReporter,

        // Stolen from http://oligofren.wordpress.com/2014/05/27/running-karma-tests-on-browserstack/
        browserDisconnectTimeout : 10000, // default 2000
        browserDisconnectTolerance : 1, // default 0
        browserNoActivityTimeout : 4*60*1000, //default 10000
        captureTimeout : 4*60*1000, //default 60000


    });
}
