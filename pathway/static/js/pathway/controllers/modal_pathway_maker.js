angular.module('opal.controllers').controller('ModalPathwayMaker', function(
  $scope, $modalInstance,
  pathwayLoader, $injector,
  pathwaySlug, episode, pathwayCallback, $window
){
  "use strict";

  var pathwayPromise = pathwayLoader(pathwaySlug, episode, true);

  pathwayPromise.then(function(pathwayDefinition){
    var pathwayService = $injector.get(
        pathwayDefinition.pathway_service
    );

    var result = new pathwayService(pathwayDefinition, episode).open();

    result.then(function(response){
      pathwayCallback(response).then(function(callBackResult){
        $modalInstance.close(callBackResult);
      });
     }, function(error){
       $window.alert("unable to save patient");
   });
  });
});
