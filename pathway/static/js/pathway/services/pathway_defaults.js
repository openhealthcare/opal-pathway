angular.module('opal.services').service('compilePathwayScope', function(
  WizardPathway, $q
){
  "use strict";
  /*
  * These are the defaults that the parent pathway scope is given
  * We can override these, for example the 'append_to' is overridden
  * by the modal pathway, as it appends to the inside of the modal.
  * Each step also inherits these defaults
  */
  return function(newScope, multistageOptions, formResult){
      var deferred = $q.defer();
      WizardPathway.createPathway(multistageOptions, formResult).then(function(pathway){
        newScope.pathway = pathway;
      });

      return deferred.promise
  };
});
