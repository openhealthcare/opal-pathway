angular.module('opal.pathway.controllers').controller(
    'PathwayController', function($scope, $http, multistage, pathway, options){
        pathway.appendTo = ".appendTo"

        pathway.finish = function(createdScope){
            // first create the episode
            var patient = createdScope.steps[0].controller.patient
            _.each(["line", "blood_culture", "antimicrobial", "diagnosis"], function(x){
                patient[x] = createdScope[x];
            });

            $http.post('/pathway/blood_culture/', patient).then(
               function(response){
                  alert('result saved');
             });
        };
        multistage.open(pathway);
    }
)
