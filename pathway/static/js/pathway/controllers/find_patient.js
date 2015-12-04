controllers.controller('FindPatientCtrl',
  function(Episode) {
    "use strict";
    var vm = this;
    vm.state = 'initial';
    vm.demographics = {
      hospital_number: undefined
    };

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
        focus('input[name="patient_demographics[0]_name"]');
    };

    vm.new_for_patient = function(patient){
        vm.demographics = patient.demographics[0];
        vm.state   = 'has_demographics';
    };
    vm.valid = function(){
        return vm.demographics.hospital_number;
    };

    vm.toSave = function(currentScope){
        currentScope.editing.demographics = vm.demographics;
    };
});
