angular.module('opal.pathway.controllers').controller(
    'PathwayController', function(
        $scope, $http, multistage, MultiStageUnwrapped, pathway, options, $window, Item, $rootScope, episode
      ){
        "use strict";
        pathway.appendTo = ".appendTo";
        if(episode){
            pathway.episode = episode;
        }

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

            var endpoint = pathway.save_url
            if(episode){
                endpoint += episode.id
            }

            $http.post(endpoint, toSave)
            .then(
               function(response){
                   if(response.data.redirect_url){
                       $window.location.href = response.data.redirect_url
                   }
             }, function(error){
                 alert("unable to save patient");
             });
        };

        multistage.open(pathway);
    }
);
