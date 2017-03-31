angular.module('opal.controllers').controller('ModalPathwayCtrl', function(
    $scope,
    $modalInstance,
    episode,
    pathwayDefinition,
    pathwayCallback,
    referencedata,
    metadata,
    $injector,
    $window
){
    "use strict";
    $scope.metadata = metadata;
    _.extend($scope, referencedata.toLookuplists());
    $scope.episode = episode;
    var pathwayService = $injector.get(
        pathwayDefinition.pathway_service
    );
    $scope.pathway = new pathwayService(pathwayDefinition, episode);
    $scope.editing = $scope.pathway.populateEditingDict(episode);
    $scope.pathway.pathwayPromise.then(function(response){
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
