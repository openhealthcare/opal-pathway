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
      this.episode = episode;
    };

    Pathway.prototype = {
      open: function(){
        this.pathwayResult = $q.defer();
        this.initialise();
        return this.pathwayResult.promise;
      },
      initialise: function(){
        var self = this;
        var scopeCompiler = new PathwayScopeCompiler();
        // return scopeCompiler.compilePathwayScope(self.episode).then(function(scope){
        //   self.scope = scope;
        //   self.scope.pathway = self;
        //   self.steps = self.createSteps(
        //     self.stepDefinitions,
        //     self.scope,
        //     self.scope.episode
        //   );
          // var pathwayTemplateLoader = new PathwayTemplateLoader(
          //   self.scope,
          //   self.pathway_insert,
          //   self.step_wrapper_template_url,
          //   self.template_url,
          //   self.steps
          // );
          // pathwayTemplateLoader.load();
        // });
      },
      createSteps: function(stepDefinitions, scope, episode){
        // return _.map(stepDefinitions, function(stepDefinition){
        //   var stepScope = scope.$new();
        //   // always put the step on the scope
        //   var step = angular.copy(stepDefinition);
        //   stepScope.step = step;
        //   step.controller = $controller(step.step_controller, {
        //     step: step,
        //     scope: stepScope,
        //     episode: episode,
        //   });
        //   step.scope = stepScope;
        //   return step;
        // });
      },
      populateScope: function(someScope, episode){
        var scopeCompiler = new PathwayScopeCompiler();
        scopeCompiler.compilePathwayScope(someScope, episode);
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
