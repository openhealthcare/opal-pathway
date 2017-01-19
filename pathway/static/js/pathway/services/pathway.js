angular.module('opal.services').service('Pathway', function(
    $http, FieldTranslater, $q, $controller, $window, PathwayScopeCompiler, pathwayTemplateLoader
){
    "use strict";
    var Pathway = function(pathwayDefinition, episode){
      this.save_url = pathwayDefinition.save_url;
      this.stepDefinitions = pathwayDefinition.steps;
      this.template_url = pathwayDefinition.template_url;
      this.append_to = pathwayDefinition.append_to;
      this.display_name = pathwayDefinition.display_name;
      this.icon = pathwayDefinition.icon;
      this.episode = episode;
    };

    Pathway.prototype = {
      open: function(){
        this.formResult = $q.defer();
        this.initialise();
        return this.formResult.promise;
      },
      initialise: function(){
        var self = this;
        var scopeCompiler = new PathwayScopeCompiler();
        return scopeCompiler.compilePathwayScope(self.episode).then(function(scope){
          self.scope = scope;
          self.scope.pathway = self;
          self.steps = self.createSteps(
            self.stepDefinitions,
            self.scope,
            self.scope.episode
          );
          pathwayTemplateLoader.load(
            self.scope,
            self.append_to,
            self.stepTemplateWrapper,
            self.template_url,
            self.steps
          );
        });
      },
      createSteps: function(stepDefinitions, scope, episode){
        return _.map(stepDefinitions, function(stepDefinition){
          var stepScope = scope.$new();
          // always put the step on the scope
          var step = angular.copy(stepDefinition);
          stepScope.step = step;
          step.controller = $controller(step.step_controller, {
            step: step,
            scope: stepScope,
            episode: episode,
          });
          step.scope = stepScope;
          return step;
        });
      },

      cancel: function(){
        this.formResult.resolve();
      },
      preSave: function(editing){},
      valid: function(editing){ return true },
      stepTemplateWrapper: function(loadedHtml, index){
        // wraps the loaded template
        return loadedHtml
      },
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
                self.formResult.resolve(response.data);
           }, function(error){
               $window.alert("unable to save patient");
           });
           return result;
      }
    };

    return Pathway;
});
