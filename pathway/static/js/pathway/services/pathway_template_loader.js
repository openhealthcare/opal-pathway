angular.module('opal.services').service('PathwayTemplateLoader', function(
  $q, $templateRequest, $compile
){
  "use strict";

  var PathwayTemplateLoader = function(
    newScope,
    pathway_insert,
    step_wrapper_template_url,
    pathway_template_url,
    steps
  ){
    this.newScope = newScope;
    this.pathway_insert = pathway_insert;
    this.step_wrapper_template_url = step_wrapper_template_url;
    this.pathway_template_url = pathway_template_url;
    this.steps = steps;
    this.step_template_node = ".step-template";
    this.cachedTemplates = {
      baseTemplate: undefined,
      stepWrapper: undefined,
      steps: []
    }
  };

  PathwayTemplateLoader.prototype = {
    getTemplatePromise: function(templateUrl){
      return $templateRequest(templateUrl);
    },
    getStepTemplates: function(){
      return _.map(this.steps, function(step){
        return this.getTemplatePromise(step.template_url);
      }, this);
    },
    populateTemplateCache: function(){
      var self = this;
      var promises = [
        self.getTemplatePromise(self.pathway_template_url),
        self.getTemplatePromise(self.step_wrapper_template_url),
      ];
      promises = promises.concat(self.getStepTemplates());
      return $q.all(promises).then(function(data){
        self.cachedTemplates.baseTemplate = data[0];
        self.cachedTemplates.stepWrapper = data[1];
        self.cachedTemplates.stepTemplates = data.splice(2, data.length);
      });
    },
    loadInSteps: function(pathwayTemplate){
      /*
      * load in the template wrapper (should already be cached)
      * load in steps
      * inject the step into the template wrapper
      * compile the output of this with the steps scope
      * aggregate all the step templates and inject them into the pathway template
      */

      var stepTemplateWrapper = this.cachedTemplates.stepWrapper;
      var stepTemplates = this.cachedTemplates.stepTemplates;
      var allSteps = _.map(stepTemplates, function(stepTemplate, index){
        var step = this.steps[index];
        var wrappedTemplate = angular.element(angular.copy(stepTemplateWrapper))
        wrappedTemplate.find(this.step_template_node).replaceWith(stepTemplate);
        return $compile(wrappedTemplate)(step.scope);
      }, this);
      $(pathwayTemplate).find(".to_append").append(allSteps);
    },
    injectSteps: function(loadedHtml){
      /*
      * injects the pathway base templates into the document, then the step templates
      */
      var baseTemplate = this.cachedTemplates.baseTemplate;
      var result = $compile(baseTemplate)(this.newScope);
      var pathwayTemplate = $(this.pathway_insert);

      pathwayTemplate.append(result);

      if(!$(this.pathway_insert).size()){
          throw "Unable to find base template to append to";
      }
      this.loadInSteps(pathwayTemplate)
    },
    load: function(newScope, pathway_insert, step_wrapper_template_url, pathway_template_url, steps){
      var self = this;
      this.populateTemplateCache().then(function(loadedHtml){
        self.injectSteps(loadedHtml);
      });
    }
  };

  return PathwayTemplateLoader;
});
