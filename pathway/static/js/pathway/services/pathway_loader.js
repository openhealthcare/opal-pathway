angular.module('opal.services')
  .factory('pathwayLoader', function($q, $route, $http, $window){
    return function(pathwayName, episode, isModal) {
	    var deferred = $q.defer();
      url = '/pathway/detail/' + pathwayName;

      if(episode){
        url = url + "/" + episode.demographics[0].patient_id + "/" + episode.id
      }

      if(isModal){
        url = url + "?" + $.param({is_modal: true});
      }

      $http.get(url).then(
        function(resource) {
		        deferred.resolve(resource.data);

        },
        function() {
	        // handle error better
	        $window.alert('Pathway could not be loaded');
        }
      );
	    return deferred.promise;
  };
});
