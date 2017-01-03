angular.module('opal.services').service('PathwayBase', function(
    $document, Referencedata, Metadata, $http, $rootScope, FieldTranslater, $q
){
    "use strict";
    var Pathway = function(pathwayDefinition, formResult){
      this.formResult = formResult;
      this.save_url = pathwayDefinition.save_url;
      this.episode = pathwayDefinition.episode;
      this.steps = pathwayDefinition.steps;
      this.template_url = pathwayDefinition.template_url;
      this.append_to = pathwayDefinition.append_to;
      this.title = pathwayDefinition.title;
      this.icon = pathwayDefinition.icon;
      this.stepLookup = {};
    };

    Pathway.prototype = {
      stepIndex: function(step){
        return _.findIndex(this.steps, function(someStep){
            return someStep.title  === step.title;
        });
      },
      cancel: function(){
          self.formResult.resolve();
      },
      preSave: function(editing){},
      valid: function(editing){ return editing; },
      finish: function(editing, steps){
          var self = this;
          var editing = angular.copy(editing);

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
          var endpoint = this.save_url;
          result = $http.post(endpoint, toSave)
          .then(
             function(response){
                self.formResult.resolve(response);
           }, function(error){
               alert("unable to save patient");
           });
           return result;
      }
    };

    Pathway.create = function(cls, pathwayDefinition, formResult){
      var deferred = $q.defer();
      $q.all([Referencedata, Metadata]).then(function(data){
        deferred.resolve(new cls(pathwayDefinition, formResult, data[0], data[1]));
      });

      return deferred.promise;
    }

    Pathway.createPathway = _.partial(Pathway.create, Pathway)

    return Pathway;
});
