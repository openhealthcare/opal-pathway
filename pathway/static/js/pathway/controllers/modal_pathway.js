angular.module('opal.controllers').controller('ModalPathwayController', function(
  $scope, $http, $q, $modalInstance,
  pathwayLoader, $injector,
  episodeLoader, recordLoader, pathwaySlug, episode
){
  "use strict";

  var pathwayPromise = pathwayLoader(pathwaySlug, episode);

  pathwayPromise.then(function(pathwayDefinition){
    var pathwayClass = $injector.get(
        pathwayDefinition.service_class,
        episode
    );

    var result = new pathwayClass(pathwayDefinition, episode).open();

    result.then(function(response){
        var episodeLoading = episodeLoader(response.data.episode_id);
        episodeLoading.then(function(episode){
          $modalInstance.close(episode);
        });
     }, function(error){
       alert("unable to save patient");
   });
  });
});
