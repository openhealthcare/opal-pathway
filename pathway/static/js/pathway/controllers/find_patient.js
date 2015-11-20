controllers.controller('FindPatientCtrl',
  function(Episode) {
    var vm = this;
    vm.state = 'initial';
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
        vm.patient = {
            demographics: [{}]
        };
        vm.state = 'editing_demographics';
        focus('input[name="patient_demographics[0]_name"]');
    };

    vm.new_for_patient = function(patient){
        vm.patient = patient;
        vm.state   = 'has_demographics';
    };
    vm.valid = function(){
        return vm.patient && vm.hospital_number;
    }
});
