angular.module('opal.controllers').controller('PathwayController', function(
  $scope, $http, multistage, pathway, options, $window, Item, $rootScope, episode, FieldTranslater
){
  "use strict";
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
});
