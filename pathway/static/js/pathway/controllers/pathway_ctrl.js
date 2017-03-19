angular.module('opal.controllers').controller('PathwayCtrl', function(
    $scope,
    pathwayDefinition,
    episode,
    referencedata,
    metadata,
    Pathway,
    $window
){
    "use strict";
    $scope.metadata = metadata;
    _.extend($scope, referencedata.toLookuplists());
    $scope.episode = episode;
    $scope.pathway = new Pathway(pathwayDefinition, episode);
    $scope.editing = $scope.pathway.populateScope(episode);
    $scope.pathway.pathwayPromise.then(function(response){
      $window.location.href = response.redirect_url;
    });
});
