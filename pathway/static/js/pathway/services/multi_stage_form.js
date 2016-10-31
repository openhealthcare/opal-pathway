angular.module('opal.services').service('multistage', function(
  $q, $rootScope, $document, $templateRequest, $compile, $controller,
  compilePathwayScope, pathwayTemplateLoader
){

  var multistage = {};

  multistage.open = function(multistageOptions){
    var newScope;
    var formResult = $q.defer();

    var compileStepScopes = function(scope){
        var episode;

        if(multistageOptions.episode){
            episode = multistageOptions.episode;
        }
        _.each(scope.steps, function(step){
          var stepScope = scope.$new();
          // always put the step on the scope
          stepScope.step = step;
          if(step.controller_class){
              step.controller = $controller(step.controller_class, {
                step: step,
                scope: stepScope,
                episode: episode,
              });
              step.scope = stepScope;
          }
          else{
              step.controller = $controller("MultistageDefault");
              step.scope = stepScope;
          }

          scope.stepLookup[step.api_name] = step;

          // this is evil evil evil secret
          // passing by reference stuff
          stepScope.editing = scope.editing;
        });
    };

    // not the best
    newScope = $rootScope.$new(true);
    multistageOptions = multistageOptions || {};
    compilePathwayScope(newScope, multistageOptions, formResult);
    compileStepScopes(newScope);
    newScope.currentIndex = 0;
    newScope.numSteps = newScope.steps.length;
    newScope.currentStep = newScope.steps[newScope.currentIndex];
    newScope.currentScope = newScope.steps[newScope.currentIndex].scope
    pathwayTemplateLoader(newScope);
    return formResult.promise;
  };

  return multistage;
});
