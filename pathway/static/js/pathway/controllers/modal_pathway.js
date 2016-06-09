angular.module('opal.controllers').controller('ModalPathwayController', function(
  $scope, $http, $q, $modalInstance,
  pathwayLoader, multistage, Options,
  pathwaySlug, episode
){
  "use strict";

  var pathwayPromise = pathwayLoader(pathwaySlug, episode);

  pathwayPromise.then(function(pathway){
    Options.then(function(options){
      if(episode){
          pathway.episode = episode;
      }

      var result = multistage.open(pathway);

      result.then(function(response){
          $modalInstance.close(response);
       }, function(error){
         alert("unable to save patient");
     });
    });
  })
});
