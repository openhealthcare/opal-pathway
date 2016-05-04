angular.module('opal.pathway.controllers').controller('FindPatientCtrl',
  function(Episode, $controller, $location) {
    "use strict";
    var parentCtrl = $controller("MultistageDefault");
    var vm = this;
    _.extend(vm, parentCtrl);

    vm.state = 'initial';

    var params = $location.search();

    vm.demographics = {
      hospital_number: undefined
    };

    if(params.hospital_number){
      vm.hospital_number = params.hospital_number;
      vm.state = 'editing_demographics';
      vm.demographics.hospital_number = vm.hospital_number;
    }

    vm.lookup_hospital_number = function() {
        Episode.findByHospitalNumber(
            vm.hospital_number,
            {
                newPatient:    vm.new_patient,
                newForPatient: vm.new_for_patient,
                error        : function(){
                    // this shouldn't happen, but we should probably handle it better
                    alert('ERROR: More than one patient found with hospital number');
                }
            });
    };

    vm.new_patient = function(result){
        vm.state = 'editing_demographics';
        vm.demographics.hospital_number = vm.hospital_number;
    };

    vm.new_for_patient = function(patient){
        vm.demographics = patient.demographics[0];
        vm.state   = 'has_demographics';
    };
    vm.showNext = function(editing){
        return vm.demographics.hospital_number;
    };

    vm.toSave = function(editing){
        editing.demographics = vm.demographics;
    };
});
