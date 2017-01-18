angular.module('opal.controllers').controller('LineController', function($controller){
    "use strict";
    var parentCtrl = $controller("DefaultStep");
    var vm = this;
    _.extend(vm, parentCtrl);
    vm.hasLine = "No";
});
