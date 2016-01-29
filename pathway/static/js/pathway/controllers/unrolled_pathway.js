angular.module('opal.pathway.controllers').controller(
    'PathwayController', function(
        $scope, $http, multistage, pathway, options, $window, Item, $rootScope
      ){
        "use strict";
        pathway.appendTo = ".appendTo";

        pathway.finish = function(createdScope, steps){
            _.each(steps, function(step){
                if(step.controller.toSave){
                    step.controller.toSave(createdScope);
                }
            });

            // cast the item to the fields for the server
            var toSave = _.mapObject(createdScope.editing, function(val, key){
                var item = new Item(val, {}, $rootScope.fields[key]);
                return item.castToType(val);
            });

            $http.post(pathway.save_url, toSave)
            .then(
               function(response){
                   var target = "/#/patient/"
                   target += response.data.patient_id
                   target += "/" + response.data.episode_id;
                   $window.location.href = target
             }, function(error){
                 alert("unable to save patient");
             });
        };
        multistage.open(pathway);
    }
);
