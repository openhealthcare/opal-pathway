describe('pathwayLoader', function() {
    "use strict"

    var $httpBackend, $route, $rootScope, $window;
    var pathwayLoader;

    beforeEach(function(){
      module('opal.services');

      inject(function($injector){
        pathwayLoader = $injector.get('pathwayLoader');
        $route = $injector.get('$route');
        $rootScope = $injector.get('$rootScope');
        $httpBackend = $injector.get('$httpBackend');
        $window = $injector.get('$window');
      });
    });

    afterEach(function(){
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should hit the back end with an episode id', function(){
        $httpBackend.expectGET('/pathway/detail/something/2/1').respond({});
        var changed = false;
        var result = pathwayLoader.load("something", "2", "1");
        result.then(function(){
          changed = true;
        });
        $rootScope.$apply();
        $httpBackend.flush();
        expect(changed).toBe(true);
    });

    it('should hit the back end without an episode id', function(){
      $httpBackend.expectGET('/pathway/detail/something').respond({});
      var changed = false;
      var result = pathwayLoader.load("something");
      result.then(function(){
        changed = true;
      });
      $rootScope.$apply();
      $httpBackend.flush();
      expect(changed).toBe(true);
    });

    it('should handle pathway load errors', function(){
      $httpBackend.expectGET('/pathway/detail/something').respond(500);
      spyOn($window, "alert");
      pathwayLoader.load("something");
      $rootScope.$apply();
      $httpBackend.flush();
      expect($window.alert).toHaveBeenCalledWith("Pathway could not be loaded");
    });


    // describe(' pathway loader', function() {
    //     it('should hit the api', function() {
    //         $route.current = { params: { id: 123 } }
    //
    //         $httpBackend.expectGET('/api/v0.1/episode/123/').respond(episodeData);
    //         var promise = episodeLoader();
    //         $rootScope.$apply();
    //         $httpBackend.flush();
    //     });
    //
    //     it('should alert on a nonexistant episode', function() {
    //         $route.current = { params: { id: 123 } }
    //         spyOn($window, 'alert');
    //
    //         $httpBackend.expectGET('/api/v0.1/episode/123/').respond(500);
    //         var promise = episodeLoader();
    //         $rootScope.$apply();
    //         $httpBackend.flush();
    //         expect($window.alert).toHaveBeenCalledWith('Episode could not be loaded')
    //     });
    //
    // });

});
