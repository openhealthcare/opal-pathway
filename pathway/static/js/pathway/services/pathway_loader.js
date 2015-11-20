angular.module('opal.pathway.services')
    .factory('pathwayLoader', function($q, $route, $http, recordLoader, Episode) {
        return function() {
    	    var deferred = $q.defer();
          recordLoader.then(function(records){
	        $http.get('/pathway/detail/'+$route.current.params.pathway).then(
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
