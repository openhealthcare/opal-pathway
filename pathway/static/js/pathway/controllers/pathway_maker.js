angular.module('opal.controllers').controller('PathwayMaker', function(
  $scope, pathwayLoader, $routeParams, episode, $window, $injector
){
  "use strict";

  var pathwayPromise = pathwayLoader($routeParams.pathway, episode);

  pathwayPromise.then(function(pathwayDefinition){
    var pathwayService = $injector.get(pathwayDefinition.pathway_service);
    var result = new pathwayService(pathwayDefinition, episode).open();

    result.then(function(response){
      if(response.redirect_url){
        $window.location.href = response.redirect_url;
      }
    }, function(error){
      $window.alert("unable to save patient");
    });
  });
});
