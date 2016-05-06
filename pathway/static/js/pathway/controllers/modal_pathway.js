angular.module('opal.controllers').controller('ModalPathwayController', function(
  $scope, $http, multistage, pathway, options, $window, Item, $rootScope, $modalInstance, episode, FieldTranslater
){
  "use strict";

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
