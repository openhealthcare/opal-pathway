angular.module('opal.controllers').controller('PathwayCtrl', function(
    $scope, pathwayDefinition, episode, referencedata, metadata, Pathway
){
    "use strict";
    $scope.metadata = metadata;
    _.extend($scope, referencedata.toLookuplists());
    $scope.episode = episode;
    $scope.pathway = new Pathway(pathwayDefinition, episode);
    $scope.editing = $scope.pathway.populateScope(episode);
});
