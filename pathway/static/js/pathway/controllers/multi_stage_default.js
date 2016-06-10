angular.module('opal.controllers').controller("MultistageDefault", function(){
    this.valid = function(){
        return true;
    };

    this.toSave = function(editing){
        // does nothing;
    };

    this.showNext = function(editing){
        return true;
    }
});
