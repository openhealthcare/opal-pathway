controllers.controller('MultiSaveCtrl',
  function(Options, $controller, step) {
      "use strict";
      var parentCtrl = $controller("MultistageDefault");
      _.extend(vm, parentCtrl);

      var vm = this;
      vm.step = step;
      vm.multipleModels = [];

      vm.cleanModel = function(editing_field){
      };

      vm.addAnother = function(){
          debugger;
          // vm.multipleModels.push(angular.copy($scope.editing[step.api_name][0]));
      };
});
