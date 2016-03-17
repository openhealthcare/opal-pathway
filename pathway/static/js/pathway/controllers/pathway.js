angular.module('opal.pathway.controllers').controller(
    'PathwayController', function(
        $scope, $http, multistage, pathway, options, $window, Item, $rootScope, episode
      ){
        "use strict";
        pathway.appendTo = ".appendTo";
        if(episode){
            pathway.episode = episode;
        }

        pathway.finish = function(createdScope, steps){
            var editing = angular.copy(createdScope.editing);

            _.each(steps, function(step){
                if(step.controller.toSave){
                    step.controller.toSave(editing);
                }
            });

            // cast the item to the fields for the server

            var toSave = _.mapObject(editing, function(val, key){
                if(_.isArray(val)){
                  return _.map(val, function(x){
                    var item = new Item(x, {}, $rootScope.fields[key]);
                    return item.castToType(x);
                  });
                }
                else{
                    var item = new Item(val, {}, $rootScope.fields[key]);
                    return [item.castToType(val)];
                }
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
