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
      // if there is a response then this was saved, otherwise it was cancelled
      if(response){
        var resolved = pathwayCallback(response);
        if(resolved && resolved.then){
          resolved.then(function(callBackResult){
            $modalInstance.close(callBackResult);
          });
        }
        else{
            $modalInstance.close(resolved);
        }
      }
      else{
        $modalInstance.close();
      }

     }, function(error){
       $window.alert("unable to save patient");
   });
  });
});
