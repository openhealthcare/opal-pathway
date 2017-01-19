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

  var loadAllTemplates = function(template_url, steps){
    // returns the pathway template as the first template, then the step templates
    return $q.all([getTemplatePromise(template_url), getStepTemplates(steps)]);
  };

  var loadInStep = function(step, index, newScope, append_to, stepTemplateWrapper){
    $templateRequest(step.template_url).then(function(loadedHtml){
        loadedHtml = stepTemplateWrapper(loadedHtml, index);
        var result = $compile(loadedHtml)(step.scope);
        $(append_to).find(".to_append").append(result);
    });
  };

  var injectSteps = function(loadedHtml, newScope, append_to, stepTemplateWrapper, steps){
    /*
    * injects the pathway base templates, then the step templates
    */
    var baseTemplate = loadedHtml[0];
    baseTemplate = baseTemplate;
    var result = $compile(baseTemplate)(newScope);
    $(append_to).append(result);

    if(!$(append_to).size()){
        throw "Unable to find base template to append to";
    }
    _.each(steps, function(step, index){
        loadInStep(step, index, newScope, append_to, stepTemplateWrapper);
    });
  };

  return {
    load: function(newScope, append_to, stepTemplateWrapper, pathway_template_url, steps){
      loadAllTemplates(pathway_template_url, steps).then(function(loadedHtml){
        injectSteps(loadedHtml, newScope, append_to, stepTemplateWrapper, steps);
      });
    }
  };
});
