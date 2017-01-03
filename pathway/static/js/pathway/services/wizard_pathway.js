angular.module('opal.services').service('WizardPathway', function(PathwayBase){
  "use strict";
  var WizardPathway = function(pathwayDefinition, formResult, referencedata, metadata){
    PathwayBase.call(this, pathwayDefinition, formResult, referencedata, metadata);
    this.currentIndex = 0;
    this.numSteps = this.steps.length;
    this.currentStep = this.steps[this.currentIndex];
  };
  WizardPathway.prototype.constructor = PathwayBase.prototype.constructor;
  WizardPathway.createPathway = _.partial(PathwayBase.create, WizardPathway);
  WizardPathway.prototype = angular.copy(PathwayBase.prototype);
  var additionalPrototype = {
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
        this.finish(editing, this.steps);
      }
    },
    goPrevious: function(){
        this.currentIndex = this.previous(this.currentIndex, this.currentStep);
        this.currentStep = this.steps[this.currentIndex];
        this.currentScope = this.currentStep.scope;
    },
    showNext: function(editing){
        return true;
    }
  };
  _.extend(WizardPathway.prototype, additionalPrototype);
  return WizardPathway;
});
