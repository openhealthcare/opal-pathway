module.exports = function(config){
  var opalPath, pythonVersion;
  if(process.env.TRAVIS){
    if(process.env.TRAVIS_PYTHON_VERSION === "2.7"){
      pythonVersion = "2.7.9";
    }
    else{
      pythonVersion = process.env.TRAVIS_PYTHON_VERSION;
    }
    opalPath = '/home/travis/virtualenv/python' + pythonVersion + '/src/opal';
  }
  else{
    opalPath = '../../opal';
  }
  var karmaDefaults = require(opalPath + '/config/karma_defaults.js');
  var baseDir = __dirname + '/..';
  var coverageFiles = [
    __dirname+'/../pathway/static/js/pathway/*.js',
    __dirname+'/../pathway/static/js/pathway/controllers/*.js',
    __dirname+'/../pathway/static/js/pathway/services/*.js'
  ];
    var includedFiles = [
      __dirname+'/../pathway/static/js/pathway/*.js',
      __dirname+'/../pathway/static/js/pathway/controllers/*.js',
      __dirname+'/../pathway/static/js/pathway/services/*.js',
      __dirname+'/../pathway/static/js/pathwaytest/*.js',
  ];

  var defaultConfig = karmaDefaults(includedFiles, baseDir, coverageFiles);
  config.set(defaultConfig);
};
