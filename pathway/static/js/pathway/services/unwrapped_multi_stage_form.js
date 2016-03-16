angular.module('opal.multistage').factory('MultiStageUnwrapped', function(
  $q, $rootScope, $document, $templateRequest, $compile, $controller, Options
){
    "use strict";

    function getTemplatePromise(options) {
         return options.template ? $q.when(options.template) :
         $templateRequest(angular.isFunction(options.template_url) ?
         options.template_url() : options.template_url);
    }

    var loadStepControllers = function(scope){
        _.each(scope.steps, function(step){
          if(step.controller_class){
              step.controller = $controller(step.controller_class, {
                  step: step,
                  scope: scope,
              });
          }
          else{
              step.controller = $controller("MultistageDefault");
              step.parentScope = scope;
          }
        });
    };

    var getStepTemplates = function(steps){
      var templatesToLoad = _.map(steps, function(step){
        return getTemplatePromise(step);
      });

      return $q.all(templatesToLoad);
    };

    var multistage = function(){
      this.open = function(multistageOptions){
        multistageOptions.template_url = "/templates/pathway/unrolled_form_base.html";
        var templateAndResolvePromise = getTemplatePromise(multistageOptions);

        templateAndResolvePromise.then(function(loadedHtml){
            var newScope = $rootScope.$new(true);
            angular.extend(newScope, multistageOptions);
            var result = $compile(loadedHtml)(newScope);
            loadStepControllers(newScope);
            $(multistageOptions.appendTo).append(result);
        });
      };
    };


    return multistage;

});
