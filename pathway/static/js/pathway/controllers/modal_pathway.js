angular.module('opal.controllers').controller('ModalPathwayController', function(
  $scope, $http, $q, $modalInstance,
  pathwayLoader, multistage, Options,
  episodeLoader, recordLoader, pathwaySlug, episode
){
  "use strict";

  var pathwayPromise = pathwayLoader(pathwaySlug, episode);

  pathwayPromise.then(function(pathway){
    Options.then(function(options){
      if(episode){
          pathway.episode = episode;
      }

      pathway.cancel = function(){
          $modalInstance.close();
      };

      var result = multistage.open(pathway);

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
});
