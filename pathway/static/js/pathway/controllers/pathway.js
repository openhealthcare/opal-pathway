angular.module('opal.pathway.controllers').controller(
    'PathwayController', function($scope, $http, multistage, pathway, options, $window){
        "use strict";
        pathway.appendTo = ".appendTo";

        pathway.finish = function(createdScope, steps){
            _.each(steps, function(step){
                if(step.controller.toSave){
                    step.controller.toSave(createdScope);
                }
            });

            $http.post('/pathway/' + pathway.slug + '/', createdScope.editing).then(
               function(response){
                 $window.location.href="/#/episode/" + response.data.episode;
             });
        };
        multistage.open(pathway);
    }
);
