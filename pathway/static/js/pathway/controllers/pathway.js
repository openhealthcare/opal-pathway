angular.module('opal.pathway.controllers').controller(
    'PathwayController', function($scope, multistage, pathway, options){
        pathway.appendTo = ".appendTo"
        multistage.open(pathway);
    }
)
