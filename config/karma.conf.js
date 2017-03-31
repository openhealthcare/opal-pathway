module.exports = function(config){
  var opalPath;
  if(process.env.TRAVIS){
    python_version = process.env.TRAVIS_PYTHON_VERSION;
    opalPath = '/home/travis/virtualenv/python' + python_version + '/src/opal';
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
