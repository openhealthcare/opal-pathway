angular.module('opal.services').service('WizardPathway', function(PathwayBase){
  "use strict";
  var WizardPathway = function(pathwayDefinition, episode){
    PathwayBase.call(this, pathwayDefinition, episode);
    this.currentIndex = 0;
  };
  WizardPathway.prototype.constructor = PathwayBase.prototype.constructor;
  WizardPathway.prototype = angular.copy(PathwayBase.prototype);
  var additionalPrototype = {
    initialise: function(){
      var self = this;
      return PathwayBase.prototype.initialise.call(this).then(function(){
        self.numSteps = self.steps.length;
        self.currentStep = self.steps[self.currentIndex];
        self.currentScope = self.currentStep.scope;
      });
    },
    hasNext: function(){
        return this.currentIndex + 1 != this.steps.length;
    },
    hasPrevious: function(){
        return this.currentIndex > 0;
    },
    next: function(currentIndex, currentStep){
        return this.currentIndex + 1;
    },
    previous: function(currentIndex, currentStep){
        return this.currentIndex - 1;
    },
    goNext: function(editing){
      if(this.hasNext()){
        this.currentIndex = this.next(this.currentIndex, this.currentStep);
        this.currentStep = this.steps[this.currentIndex];
        this.currentScope = this.currentStep.scope;
      }
      else{
        this.finish(editing);
      }
    },
    stepIndex: function(step){
      return _.findIndex(this.steps, function(someStep){
          return someStep.title  === step.title;
      });
    },
    goPrevious: function(){
        this.currentIndex = this.previous(this.currentIndex, this.currentStep);
        this.currentStep = this.steps[this.currentIndex];
        this.currentScope = this.currentStep.scope;
    },
    showNext: function(editing){
        return true;
    },
    stepTemplateWrapper: function(loadedHtml, index){
      // wraps the loaded template
      return "<div ng-if='pathway.currentIndex == " + index + "'>" + loadedHtml + "</div>";
    }
  };
  _.extend(WizardPathway.prototype, additionalPrototype);
  return WizardPathway;
});
