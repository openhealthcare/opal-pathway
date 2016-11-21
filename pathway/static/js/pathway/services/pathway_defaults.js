angular.module('opal.services').service('compilePathwayScope', function(
  $document, $rootScope, Metadata, Referencedata, FieldTranslater, $http
){
  "use strict";
  /*
  * These are the defaults that the parent pathway scope is given
  * We can override these, for example the 'append_to' is overridden
  * by the modal pathway, as it appends to the inside of the modal.
  * Each step also inherits these defaults
  */


  return function(newScope, multistageOptions, formResult){
    var multistageDefaults = {
        steps: [],
        // is there another step to move onto, this is called as to whether we show
        // a "Next" or "Save"
        hasNext: function(){
            return newScope.currentIndex + 1 != newScope.steps.length;
        },
        // is there a previous step, this is called as to whether we show the
        // previous button
        hasPrevious: function(){
            return newScope.currentIndex > 0;
        },
        // the editing object that will be saved at the end
        editing: {},
        // the part of the page that we append the pathway to
        append_to: $document.find('body').eq(0),
        template_url: function(){
            return "/templates/pathway/form_base.html";
        },
        // the function called on a Step when the next button is pressed
        goNext: function(){
          if(newScope.hasNext()){
            newScope.currentIndex = newScope.next(newScope.currentIndex, newScope.currentStep);
            newScope.currentStep = newScope.steps[newScope.currentIndex];
            newScope.currentScope = newScope.currentStep.scope;
          }
          else{
            newScope.finish(newScope, newScope.steps);
          }
        },
        // the function called on a Step when the back (not in the browser) button is pressed
        goPrevious: function(){
            newScope.currentIndex = newScope.previous(
            newScope.currentIndex, newScope.currentStep);
            newScope.currentStep = newScope.steps[newScope.currentIndex];
            newScope.currentScope = newScope.currentStep.scope;
        },
        cancel: function(){
            formResult.resolve();
        },
        stepLookup: {},
        finish: function(createdScope, steps){
            var editing = angular.copy(createdScope.editing);

            _.each(steps, function(step){
                if(step.scope.preSave){
                    step.scope.preSave(editing);
                }
            });

            // cast the item to the fields for the server
            var toSave = _.mapObject(editing, function(val, key){
              var result;
              if(_.isArray(val)){
                result = _.map(val, function(x){
                    return FieldTranslater.jsToSubrecord(x, key);
                });
              }
              else{
                  result = [FieldTranslater.jsToSubrecord(val, key)];
              }
              return _.filter(result, function(subrecord){
                  return _.size(subrecord);
              });
            });
            var endpoint = newScope.save_url
            result = $http.post(endpoint, toSave)
            .then(
               function(response){
                  formResult.resolve(response);
             }, function(error){
                 alert("unable to save patient");
             });
             return result;
        },
        preSave: function(editing){},
        // this function is called if we want to show the next button or not
        showNext: function(editing){
            return true;
        },
        valid: function(form){
            return form;
        }
    };

    angular.extend(newScope, multistageDefaults, multistageOptions);

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

    newScope.stepIndex = function(step){
        return _.findIndex(newScope.steps, function(someStep){
            return someStep.title  === step.title;
        });
    };

    Referencedata.then(function(referencedata){
      _.extend(newScope, referencedata.toLookuplists());
    });

    Metadata.then(function(metadata){
        newScope.metadata = metadata;
    });
  };
});
