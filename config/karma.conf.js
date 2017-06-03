module.exports = function(config){
  var opalPath = process.env.OPAL_LOCATION;
  var karmaDefaults = require(opalPath + '/opal/tests/js_config/karma_defaults.js');
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
