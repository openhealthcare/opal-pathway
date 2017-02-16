describe("PathwayMaker", function(){
  "use strict";

  var $controller, $scope, $rootScope;
  var episode = "some episode";
  var pathwaySlug = "some_pathway";
  var argumentSpy, mockInjector, $modalInstance;
  var pathwayLoader, callBack, $window;
  var $routeParams;

  beforeEach(function(){
    module('opal.controllers');
    $routeParams = {pathway: "somePathway"};
    argumentSpy = jasmine.createSpy();
    $window = {location: {}};

    pathwayLoader = function(slug, episode, isModal){
      argumentSpy(pathwaySlug, episode, isModal);
      return {
        then: function(fn){
          fn({pathway_service: "someService"});
        }
      };
    };

    callBack = jasmine.createSpy();
    callBack.and.callFake(function(someResponse){
      return {then: function(fn){ fn(someResponse); }};
    });


    inject(function($injector){
      $controller = $injector.get('$controller');
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
    });
  });

  it("should work if the call back doesn't return a promise", function(){
    var pathwayServiceArgs = jasmine.createSpy();
    var mockPathwayService = function(pathwaySlug, episode, isModal){
      pathwayServiceArgs(pathwaySlug, episode, isModal);
      this.open = function(){
        return {
          then: function(fn){
            fn({
              episode_id: 1,
              patient_id: 1,
              redirect_url: "somewhere"
            });
          }
        };
      };
    };
    mockInjector = {
      get: function(something){ return mockPathwayService; }
    };
    $controller("PathwayMaker", {
      $scope: $scope,
      $injector: mockInjector,
      pathwaySlug: pathwaySlug,
      pathwayLoader: pathwayLoader,
      episode: episode,
      $window: $window
    });
    expect(pathwayServiceArgs).toHaveBeenCalledWith(
      {pathway_service: "someService"}, episode, undefined
    );
    expect(argumentSpy).toHaveBeenCalledWith(
      "some_pathway", episode, undefined
    );
    expect($window.location.href).toEqual("somewhere");
  });

});
