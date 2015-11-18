angular.module('opal.multistage').provider('multistage', function(){
    var multiStageProvider = {
        $get: [function(){
            var multistage = {};
            multistage.hello = function(){
                alert('woop woop');
            };

            return multistage;
        }]
    };
});
