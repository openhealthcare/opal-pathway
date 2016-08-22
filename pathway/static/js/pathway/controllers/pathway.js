angular.module('opal.controllers').controller('PathwayController', function(
  $scope, $http, $q, pathwayLoader, multistage, $routeParams, episode,
  $window
){
  "use strict";

  var pathwayPromise = pathwayLoader($routeParams.pathway, episode);

  pathwayPromise.then(function(pathway){
    if(episode){
        pathway.episode = episode;
    }

    var result = multistage.open(pathway);

    result.then(function(response){
       if(response.data.redirect_url){
           $window.location.href = response.data.redirect_url;
       }
     }, function(error){
             alert("unable to save patient");
     });
  })
})
