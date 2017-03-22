angular.module('opal.controllers').controller(
  "DefaultSingleStep", function(scope, step, episode){
    if(scope.editing[step.model_api_name]){
      // TODO change it so that its always an array
      if(_.isArray(scope.editing[step.model_api_name]) && scope.editing[step.model_api_name].length){
        scope.editing[step.model_api_name] = _.last(scope.editing[step.model_api_name]);
      }
      else{
        scope.editing[step.model_api_name] = scope.editing[step.model_api_name];
      }
    }
    else if(episode){
      scope.editing[step.model_api_name] = episode.newItem(step.model_api_name);
    }
    else{
      // TODO change this when we support subrecord creation without an episode
      scope.editing[step.model_api_name] = {};
    }
  }
);
