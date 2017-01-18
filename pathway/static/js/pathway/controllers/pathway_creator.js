angular.module('opal.controllers').controller('PathwayCreator', function(
  $scope, $http, $q, pathwayLoader, $routeParams, episode, $window, $injector
){
  "use strict";

  var pathwayPromise = pathwayLoader($routeParams.pathway, episode);

  pathwayPromise.then(function(pathwayDefinition){
    var pathwayClass = $injector.get(pathwayDefinition.service_class);
    var result = new pathwayClass(pathwayDefinition, episode).open();

    result.then(function(response){
      if(response.redirect_url){
        $window.location.href = response.redirect_url;
      }
    }, function(error){
      alert("unable to save patient");
    });
  });
});
