angular.module('opal.controllers').controller('PathwayCtrl', function(
    $scope, pathwayDefinition, episode, referencedata, metadata, Pathway
){
    "use strict";
    $scope.pathway = new Pathway(pathwayDefinition, episode);
    $scope.pathway.populateScope($scope, episode);
});
