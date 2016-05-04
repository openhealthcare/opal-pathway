angular.module('opal.pathway.services')
    .factory('pathwayLoader', function($q, $route, $http, recordLoader, Episode){
        return function(pathwayName) {
    	    var deferred = $q.defer();
          recordLoader.then(function(records){
	        $http.get('/pathway/detail/' + pathwayName).then(
              function(resource) {
      		        deferred.resolve(resource.data);

	            }, function() {
    		        // handle error better
    		        alert('Pathway could not be loaded');
	            });
            });
      	    return deferred.promise;
        };
    });
