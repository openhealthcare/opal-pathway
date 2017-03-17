angular.module('opal.services').service('Pathway', function(
    $http, FieldTranslater, $q, $controller, $window, PathwayScopeCompiler, PathwayTemplateLoader
){
    "use strict";
    var Pathway = function(pathwayDefinition, episode){
      this.save_url = pathwayDefinition.save_url;
      this.steps = pathwayDefinition.steps;
      this.template_url = pathwayDefinition.template_url;
      this.pathway_insert = pathwayDefinition.pathway_insert;
      this.display_name = pathwayDefinition.display_name;
      this.icon = pathwayDefinition.icon;
      this.step_wrapper_template_url = pathwayDefinition.step_wrapper_template_url;
      this.finish_button_text = pathwayDefinition.finish_button_text;
      this.finish_button_icon = pathwayDefinition.finish_button_icon;
      this.pathwayResult = $q.defer();
      this.episode = episode;
    };

    Pathway.prototype = {
      register: function(apiName, stepScope){
        var step = _.findWhere(this.steps, {api_name: apiName});
        step.scope = stepScope;
      },
      populateScope: function(episode){
        var scopeCompiler = new PathwayScopeCompiler();
        return scopeCompiler.compilePathwayScope(episode);
      },
      cancel: function(){
        this.pathwayResult.resolve();
      },
      preSave: function(editing){},
      valid: function(editing){ return true; },
      finish: function(editing){
          var self = this;
          editing = angular.copy(editing);

          _.each(self.steps, function(step){
              if(step.scope.preSave){
                  step.scope.preSave(editing);
              }
          });

          // cast the item to the fields for the server
          var toSave = _.mapObject(editing, function(val, key){
            var result;
            if(_.isArray(val)){
              result = _.map(val, function(x){
                delete x._client;
                return FieldTranslater.jsToSubrecord(x, key);
              });
            }
            else{
              delete val._client;
              result = [FieldTranslater.jsToSubrecord(val, key)];
            }
            return _.filter(result, function(subrecord){
                return _.size(subrecord);
            });
          });
          var endpoint = this.save_url;
          var result = $http.post(endpoint, toSave).then(
             function(response){
                self.pathwayResult.resolve(response.data);
           }, function(error){
               $window.alert("unable to save patient");
           });
           return result;
      }
    };

    return Pathway;
});
