angular.module('opal.multistage')
.controller("MultistageDefault", function(){
    this.valid = function(){
        return true;
    };

    this.toSave = function(editing){
        // does nothing;
    };

    this.showNext = function(editing){
        return true;
    }
})
.provider('multistage', function(){
    var multistageProvider = {
        $get: [
            '$q', '$rootScope', '$document', '$templateRequest',
            '$compile', '$controller', 'Options',

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
                    finish: function(currentScope, steps){
                        // first deal with referal
                        // needs to be overridden;
                    },
                    template_url: function(){
                        if(multistageOptions.unrolled){
                            return "/templates/pathway/unrolled_form_base.html"
                        }
                        return "/templates/pathway/form_base.html"
                    },
                    goNext: function(){
                      if(multistageOptions.hasNext()){
                          newScope.currentIndex = multistageOptions.next(
                              newScope.currentIndex, newScope.currentStep);
                        newScope.currentStep = multistageOptions.steps[newScope.currentIndex];
                      }
                      else{
                        multistageOptions.finish(newScope, multistageOptions.steps);
                      }
                    },
                    goPrevious: function(){
                        newScope.currentIndex = multistageOptions.previous(
                            newScope.currentIndex, newScope.currentStep);
                      newScope.currentStep = multistageOptions.steps[newScope.currentIndex];
                    },
                    goToFinish: function(){
                        multistageOptions.finish(newScope, multistageOptions.steps)
                    }
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
                          step.controller = $controller(step.controller_class, {
                            step: step,
                            scope: scope,
                          });
                      }
                      else{
                          step.controller = $controller("MultistageDefault");
                      }
                    });
                };

                var loadInStep = function(step, index){
                    getTemplatePromise(step).then(function(loadedHtml){
                        if(multistageOptions.unrolled){
                            unrolled_titles = "<h4 class='text-center content-offset-25'>[[ steps["+index+"].title ]]</h4>";
                            if(index>0){
                                unrolled_titles = "<hr>" + unrolled_titles;
                            }
                            loadedHtml = unrolled_titles + loadedHtml;
                        }else{
                            loadedHtml = "<div ng-if='currentIndex == " + index + "'>" + loadedHtml + "</div>";
                        }
                        var result = $compile(loadedHtml)(newScope);
                        $(multistageOptions.appendTo).find(".to_append").append(result);
                    });
                };

                multistageOptions = multistageOptions || {};
                multistageOptions = angular.extend({}, multistageDefaults, multistageOptions);

                // not the best
                newScope = $rootScope.$new(true);
                newScope.editing = {};
                angular.extend(newScope, multistageOptions);
                newScope.currentIndex = 0;
                newScope.numSteps = multistageOptions.steps.length;
                newScope.editing = {};


                // We were passed in a patient.
                // Let's make sure we can edit every item for the patient.
                if(multistageOptions.episode){
                    _.each(_.keys($rootScope.fields), function(key){
                        var copies = _.map(
                            multistageOptions.episode[key],
                            function(record){
                                return record.makeCopy();
                            });
                        if(copies.length > 0){
                            newScope.editing[key] = copies[0]
                        }else{
                            newScope.editing[key] = {}
                        }
                    });
                }

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
                    loadStepControllers(newScope);
                    var baseTemplate = loadedHtml[0];
                    var result = $compile(baseTemplate)(newScope);
                    $(multistageOptions.appendTo).append(result);
                    _.each(multistageOptions.steps, function(step, index){
                        loadInStep(step, index);
                    });
                });
            };

            return multistage;
        }]
    };

    return multistageProvider;
});
