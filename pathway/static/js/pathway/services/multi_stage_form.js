angular.module('opal.services').controller("MultistageDefault", function(){
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
            '$http', '$q', '$rootScope', '$document', '$templateRequest',
            '$compile', '$controller', 'Options', 'FieldTranslater',
        function($http, $q, $rootScope, $document, $templateRequest, $compile, $controller, Options, FieldTranslater){
            function getTemplatePromise(options) {
                 return options.template ? $q.when(options.template) :
                 $templateRequest(angular.isFunction(options.template_url) ?
                 options.template_url() : options.template_url);
            }

            var multistage = {};
            var formResult = $q.defer();

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
                    append_to: $document.find('body').eq(0),
                    template_url: function(){
                        return "/templates/pathway/form_base.html";
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
                    },
                    cancel: function(){
                        formResult.resolve();
                    },
                    finish: function(createdScope, steps){
                        var editing = angular.copy(createdScope.editing);

                        _.each(steps, function(step){
                            if(step.controller.toSave){
                                step.controller.toSave(editing);
                            }
                        });

                        // cast the item to the fields for the server

                        var toSave = _.mapObject(editing, function(val, key){
                          if(_.isArray(val)){
                            return _.map(val, function(x){
                                FieldTranslater.jsToSubrecord(x, key);
                            });
                          }
                          else{
                              return [FieldTranslater.jsToSubrecord(val, key)];
                          }
                        });

                        var endpoint = multistageOptions.save_url
                        result = $http.post(endpoint, toSave)
                        .then(
                           function(response){
                              formResult.resolve(response);
                         }, function(error){
                             alert("unable to save patient");
                         });
                         return result;
                    }

                };

                var getStepTemplates = function(steps){
                  var templatesToLoad = _.map(steps, function(step){
                    return getTemplatePromise(step);
                  });

                  return $q.all(templatesToLoad);
                };

                var loadStepControllers = function(scope){
                    var episode;

                    if(multistageOptions.clonedEpisode){
                        episode = multistageOptions.clonedEpisode;
                    }
                    _.each(scope.steps, function(step){
                      if(step.controller_class){
                          step.controller = $controller(step.controller_class, {
                            step: step,
                            scope: scope,
                            episode: episode,
                          });
                      }
                      else{
                          step.controller = $controller("MultistageDefault");
                      }
                    });
                };

                var loadInStep = function(step, index){
                    getTemplatePromise(step).then(function(loadedHtml){
                        loadedHtml = "<div ng-if='currentIndex == " + index + "'>" + loadedHtml + "</div>";
                        var result = $compile(loadedHtml)(newScope);
                        $(multistageOptions.append_to).find(".to_append").append(result);
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
                    var clonedEpisode = {};
                    _.each(_.keys($rootScope.fields), function(key){
                        var copies = _.map(
                            multistageOptions.episode[key],
                            function(record){
                                return record.makeCopy();
                            });
                        clonedEpisode[key] = copies;
                        if(copies.length > 0){
                            newScope.editing[key] = copies[0]
                        }else{
                            newScope.editing[key] = {}
                        }
                    });
                    multistageOptions.clonedEpisode = clonedEpisode;
                }

                newScope.currentStep = newScope.steps[newScope.currentIndex];
                newScope.stepIndex = function(step){
                    return _.findIndex(newScope.steps, function(someStep){
                        return someStep.title  === step.title;
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
                    $(multistageOptions.append_to).append(result);
                    if(!$(multistageOptions.append_to).size()){
                        throw "Unable to find base template to append to";
                    }
                    _.each(multistageOptions.steps, function(step, index){
                        loadInStep(step, index);
                    });
                });


                return formResult.promise;
            };

            return multistage;
        }]
    };

    return multistageProvider;
});
