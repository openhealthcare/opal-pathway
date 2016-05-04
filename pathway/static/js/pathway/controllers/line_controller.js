angular.module('opal.pathway.controllers').controller('LineController', function($controller){
    "use strict";
    var parentCtrl = $controller("MultistageDefault");
    var vm = this;
    _.extend(vm, parentCtrl);
    vm.hasLine = "No";
});
