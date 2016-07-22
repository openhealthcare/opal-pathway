angular.module('opal.controllers').controller('SingleStepCtrl', function(scope, step, episode) {
  if(!scope.editing[step.api_name] || !scope.editing[step.api_name].length){
    scope.editing[step.api_name] = {};
  }
  else{
    scope.editing[step.api_name] = _.last(scope.editing[step.api_name])
  }
});
