controllers.controller('MultiSaveCtrl',
  function(Options, $controller, step, scope) {
      "use strict";
      var parentCtrl = $controller("MultistageDefault");
      _.extend(vm, parentCtrl);

      var vm = this;
      vm.step = step;
      vm.multipleModels = [];

      vm.cleanModel = function(editing_field){
          _.each(_.keys(editing_field.procedure), function(a){
              editing_field.procedure[a] = undefined;
          });
      };

      vm.addAnother = function(){
          vm.multipleModels.push(angular.copy(scope.editing[step.api_name]));
          vm.cleanModel(scope.editing[step.api_name]);
      };

      vm.remove = function($index){
          vm.multipleModels.splice($index, 1);
      };

      vm.toSave = function(currentScope){
          alert('hello');
      };
});
