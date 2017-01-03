angular.module('opal.services').service('multistage', function(
  $q, $rootScope, $document, $templateRequest, $compile, $controller,
  WizardPathway, pathwayTemplateLoader, Referencedata, Metadata
){

  var multistage = {};

  multistage.open = function(multistageOptions){
    var newScope;
    var formResult = $q.defer();

    var compileStepScopes = function(pathway, scope, episode){
        _.each(pathway.steps, function(step){
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

          pathway.stepLookup[step.api_name] = step;
        });
    };

    newScope = $rootScope.$new(true);
    multistageOptions = multistageOptions || {};

    $q.all([Referencedata, Metadata]).then(function(data){
      _.extend(newScope, data[0].toLookuplists());
      newScope.metadata = data[1];
      newScope.pathway = new WizardPathway(multistageOptions, formResult);
      newScope.editing = {};

      if(multistageOptions.episode){
        _.each(_.keys($rootScope.fields), function(key){
            var copies = _.map(
                multistageOptions.episode[key],
                function(record){
                    return record.makeCopy();
                });
            if(copies.length > 1){
                newScope.editing[key] = copies;
            }
            else if(copies.length === 1){
                newScope.editing[key] = copies[0];

            }else{
                newScope.editing[key] = {};
            }
        });
      }

      compileStepScopes(newScope.pathway, newScope, multistageOptions.episode);
      newScope.pathway.currentScope = newScope.pathway.steps[newScope.pathway.currentIndex].scope;
      pathwayTemplateLoader(
          newScope,
          multistageOptions.append_to,
          multistageOptions.template_url,
          newScope.pathway.steps
      );
      window.scope = newScope;
    });

    return formResult.promise;
  };

  return multistage;
});
