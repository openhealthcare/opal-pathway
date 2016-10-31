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

  var loadAllTemplates = function(newScope){
    // returns the pathway template as the first template, then the step templates
    return $q.all([getTemplatePromise(newScope.template_url), getStepTemplates(newScope.steps)]);
  };

  var loadInStep = function(step, index, newScope){
    $templateRequest(step.template_url).then(function(loadedHtml){
        loadedHtml = "<div ng-if='currentIndex == " + index + "'>" + loadedHtml + "</div>";
        var result = $compile(loadedHtml)(step.scope);
        $(newScope.append_to).find(".to_append").append(result);
    });
  };

  var injectSteps = function(loadedHtml, newScope){
    /*
    * injects the pathway base templates, then the step templates
    */
    var baseTemplate = loadedHtml[0];
    baseTemplate = baseTemplate;
    var result = $compile(baseTemplate)(newScope);
    $(newScope.append_to).append(result);

    if(!$(newScope.append_to).size()){
        throw "Unable to find base template to append to";
    }
    _.each(newScope.steps, function(step, index){
        loadInStep(step, index, newScope);
    });
  };

  return function(newScope){
    loadAllTemplates(newScope).then(function(loadedHtml){
      injectSteps(loadedHtml, newScope);
    });
  };
});
