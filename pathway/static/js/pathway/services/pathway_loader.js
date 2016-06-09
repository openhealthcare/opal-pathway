angular.module('opal.services')
    .factory('pathwayLoader', function($q, $route, $http, recordLoader){
        return function(pathwayName, episode) {
    	    var deferred = $q.defer();
          recordLoader.then(function(records){
          url = '/pathway/detail/' + pathwayName;

          if(episode){
            url = url + "/" + episode.demographics[0].patient_id + "/" + episode.id
          }

	        $http.get(url).then(
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
