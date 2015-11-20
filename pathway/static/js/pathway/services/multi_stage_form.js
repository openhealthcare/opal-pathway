angular.module('opal.multistage')
.controller("multistageDefault", function(){
    this.valid = function(){
        return true;
    };
})
.provider('multistage', function(){
    var multistageProvider = {
        $get: ['$q', '$rootScope', '$document', '$templateRequest', '$compile', '$controller', 'Options',
        function($q, $rootScope, $document, $templateRequest, $compile, $controller, Options){
            function getTemplatePromise(options) {
                 return options.template ? $q.when(options.template) :
                 $templateRequest(angular.isFunction(options.template_url) ?
                 options.template_url() : options.template_url);
            }

            var multistage = {};

            multistage.open = function(multistageOptions){
                var newScope;

                var multistageDefaults = {
                    next: function(index, step){
                        if(index + 1 === multistageOptions.steps.length){
                            return finish();
                        }
                        return index + 1;
                    },
                    steps: [],
                    previous: function(index, step){
                        return index - 1;
                    },
                    hasNext: function(){
                        return newScope.currentIndex + 1 != multistageOptions.steps.length;
                    },
                    hasPrevious: function(){
                        return newScope.currentIndex > 0;
                    },
                    appendTo: $document.find('body').eq(0),
                    finish: function(currentScope){
                        // needs to be overridden;
                    },
                    template_url: "/pathway/templates/pathway/form_base.html",
                    goNext: function(){
                      if(multistageOptions.hasNext()){
                        newScope.currentIndex = multistageOptions.next(newScope.currentIndex, newScope.currentStep);
                        var newStep = multistageOptions.steps[newScope.currentIndex];
                        loadInStep(newStep);
                        newScope.currentStep = newStep;
                      }
                      else{
                        multistageOptions.finish(newScope);
                      }
                    },
                    goPrevious: function(){
                      newScope.currentIndex = multistageOptions.previous(newScope.currentIndex, newScope.currentStep);
                      var newStep = multistageOptions.steps[newScope.currentIndex];
                      loadInStep(newStep);
                      newScope.currentStep = newStep;
                    }
                };

                var appendStep = function(someStep){
                    getTemplatePromise(someStep).then(function(loadedHtml){
                        var result = $compile(loadedHtml)(newScope);
                        $(multistageOptions.appendTo).append(result);
                    });
                };

                var getStepTemplates = function(steps){
                  var templatesToLoad = _.map(steps, function(step){
                    return getTemplatePromise(step);
                  });

                  return $q.all(templatesToLoad);
                };

                var loadStepControllers = function(scope){
                    _.each(scope.steps, function(step){
                      if(step.controller_class){
                          step.controller = $controller(step.controller_class);
                      }
                      else{
                          step.controller = $controller("multistageDefault");
                      }
                    });
                };

                var loadInStep = function(step){
                    getTemplatePromise(step).then(function(loadedHtml){
                        loadedHtml = "<div class='to_replace'>" + loadedHtml + "</div>";
                        var result = $compile(loadedHtml)(newScope);
                        $(multistageOptions.appendTo).find(".to_replace").replaceWith(result);
                    });
                };

                multistageOptions = multistageOptions || {};
                multistageOptions = angular.extend({}, multistageDefaults, multistageOptions);

                // not the best
                newScope = $rootScope.$new(true);
                angular.extend(newScope, multistageOptions);
                newScope.currentIndex = 0;
                newScope.currentStep = newScope.steps[newScope.currentIndex];
                newScope.stepIndex = function(step){
                    return _.findIndex(newScope.steps, function(someStep){
                        return someStep.title === step.title;
                    });
                };

                Options.then(function(options){
                  for (var name in options) {
                    if (name.indexOf('micro_test') !== 0) {
                    		newScope[name + '_list'] = _.uniq(options[name]);
                    }
                  }
                });

                var templateAndResolvePromise = getTemplatePromise(multistageOptions);
                templateSteps = getStepTemplates(multistageOptions.steps);
                $q.all([templateAndResolvePromise, templateSteps]).then(function(loadedHtml){
                    loadedHtml = loadedHtml[0];
                    loadStepControllers(newScope);
                    var result = $compile(loadedHtml)(newScope);
                    $(multistageOptions.appendTo).append(result);
                    loadInStep(multistageOptions.steps[newScope.currentIndex]);
                });
            };

            return multistage;
        }]
    };

    return multistageProvider;
});
