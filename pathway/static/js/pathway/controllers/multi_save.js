angular.module('opal.controllers').controller('MultiSaveCtrl',
  function(Options, $controller, step, scope, episode) {
      "use strict";
      var key = step.api_name;

      scope.step = step;

      scope.addAnother = function(){
          scope.allEditing.push({key: undefined});
      };

      scope.instanceName = step.title;

      scope.init = function(){
        scope.allEditing = _.map(episode[key], function(row){
            var editing = {}
            editing[key] = row;
            return editing;
        });

        // add a blank row to the bottom
        scope.addAnother();
      };

      scope.remove = function($index){
          scope.allEditing.splice($index, 1);
      };

      scope.preSave = function(editing){
          var all_models = angular.copy(scope.allEditing);

          var result = _.reduce(all_models, function(memo, row){
            return memo.concat(_.values(row));
          }, [])

          editing[step.api_name] = result;
      };

      scope.init();
});
