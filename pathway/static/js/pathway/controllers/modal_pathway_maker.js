angular.module('opal.controllers').controller('ModalPathwayMaker', function(
  $scope, $http, $q, $modalInstance,
  pathwayLoader, $injector,
  episodeLoader, recordLoader, pathwaySlug, episode
){
  "use strict";

  var pathwayPromise = pathwayLoader(pathwaySlug, episode, true);

  pathwayPromise.then(function(pathwayDefinition){
    var pathwayService = $injector.get(
        pathwayDefinition.pathway_service,
        episode
    );

    var result = new pathwayService(pathwayDefinition, episode).open();

    result.then(function(response){
      if(response){
        var episodeLoading = episodeLoader(response.episode_id);
        episodeLoading.then(function(episode){
          $modalInstance.close(episode);
        });
      }
      else{
          $modalInstance.close();
      }

     }, function(error){
       alert("unable to save patient");
   });
  });
});
