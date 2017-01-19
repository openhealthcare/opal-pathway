angular.module('opal.services').service('pathwayTemplateLoader', function(
  $q, $templateRequest, $compile
){
  /*
  * This returns a function that loads in the scope and a set of steps
  * it loads their templates, compiles their templates and
  * injects them into the body template
  */
  var getTemplatePromise = function(templateUrl) {
   return $templateRequest(templateUrl);
  };

  var getStepTemplates = function(steps){
    var templatesToLoad = _.map(steps, function(step){
      return getTemplatePromise(step.template_url);
    });

    return $q.all(templatesToLoad);
  };

  var loadAllTemplates = function(template_url, step_wrapper_template_url, steps){
    // returns the pathway template as the first template, then the step templates
    return $q.all([getTemplatePromise(template_url), getTemplatePromise(step_wrapper_template_url), getStepTemplates(steps)]);
  };

  var loadInSteps = function(pathwayTemplate, steps, step_template_node, step_wrapper_template_url){
    /*
    * load in the template wrapper (should already be cached)
    * load in steps
    * inject the step into the template wrapper
    * compile the output of this with the steps scope
    * aggregate all the step templates and inject them into the pathway template
    */
    getTemplatePromise(step_wrapper_template_url).then(function(stepTemplateWrapper){
      getStepTemplates(steps).then(function(stepTemplates){
        var allSteps = _.map(stepTemplates, function(stepTemplate, index){
          var step = steps[index];
          var wrappedTemplate = angular.element(angular.copy(stepTemplateWrapper))
          wrappedTemplate.find(step_template_node).replaceWith(stepTemplate);
          return $compile(wrappedTemplate)(step.scope);
        });
        $(pathwayTemplate).find(".to_append").append(allSteps);
      });
    });
  };

  var injectSteps = function(loadedHtml, newScope, pathway_insert, step_template_node, step_wrapper_template_url, steps){
    /*
    * injects the pathway base templates into the document, then the step templates
    */
    var baseTemplate = loadedHtml[0];
    var result = $compile(baseTemplate)(newScope);
    var parentDocument = $(pathway_insert);

    parentDocument.append(result);

    if(!$(pathway_insert).size()){
        throw "Unable to find base template to append to";
    }
    loadInSteps(parentDocument, steps, step_template_node, step_wrapper_template_url)
  };

  return {
    load: function(newScope, pathway_insert, step_wrapper_template_url, pathway_template_url, steps){
      loadAllTemplates(pathway_template_url, step_wrapper_template_url, steps).then(function(loadedHtml){
        var step_template_node = ".step-template";
        injectSteps(loadedHtml, newScope, pathway_insert, step_template_node, step_wrapper_template_url, steps);
      });
    }
  };
});
