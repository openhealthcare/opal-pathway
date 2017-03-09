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
    _getStepTemplates: function(){
      return _.map(this.steps, function(step){
        return $templateRequest(step.template_url);
      }, this);
    },
    _populateTemplateCache: function(){
      var self = this;
      var promises = [
        $templateRequest(self.pathway_template_url),
        $templateRequest(self.step_wrapper_template_url),
      ];
      promises = promises.concat(self._getStepTemplates());
      return $q.all(promises).then(function(data){
        self.cachedTemplates.baseTemplate = data[0];
        self.cachedTemplates.stepWrapper = data[1];
        self.cachedTemplates.stepTemplates = data.splice(2, data.length);
      });
    },
    _loadInSteps: function(pathwayTemplate){
      /*
      * wrap the steps in the stepTemplateWrapper
      * inject them into the pathway template
      */

      var stepTemplateWrapper = this.cachedTemplates.stepWrapper;
      var stepTemplates = this.cachedTemplates.stepTemplates;
      var allSteps = _.map(stepTemplates, function(stepTemplate, index){
        var step = this.steps[index];
        var wrappedTemplate = angular.element(angular.copy(stepTemplateWrapper))
        wrappedTemplate.find(this.step_template_node).replaceWith(stepTemplate);
        return $compile(wrappedTemplate)(step.scope);
      }, this);
      pathwayTemplate.find(".to_append").append(allSteps);
    },
    _loadInPathway: function(){
      /*
      * injects the pathway base templates into the document, then the step templates
      */
      var baseTemplate = this.cachedTemplates.baseTemplate;
      var result = $compile(baseTemplate)(this.newScope);
      var pathwayTemplate = $(this.pathway_insert);

      if(!pathwayTemplate.size()){
          throw "Unable to find base template to append to";
      }

      pathwayTemplate.append(result);

      // this._loadInSteps(pathwayTemplate)
    },
    load: function(){
      /*
      * the public method that triggers the load
      */
      var self = this;
      return this._populateTemplateCache().then(function(){
        self._loadInPathway();
      });
    }
  };

  return PathwayTemplateLoader;
});
