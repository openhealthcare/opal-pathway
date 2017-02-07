describe("ModalPathwayMaker", function(){
  "use strict";

  var $controller, $scope, $rootScope;
  var episode = "some episode";
  var pathwaySlug = "some_pathway";
  var argumentSpy, mockInjector, $modalInstance;
  var pathwayLoader, callBack;

  beforeEach(function(){
    module('opal.controllers');
    argumentSpy = jasmine.createSpy();

    $modalInstance = {close: function(){}};
    spyOn($modalInstance, "close");


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

  it("should flow through on success", function(){
    var mockPathwayService = function(pathwaySlug, episode, isModal){
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

    $controller("ModalPathwayMaker", {
      $scope: $scope,
      $modalInstance: $modalInstance,
      $injector: mockInjector,
      pathwaySlug: pathwaySlug,
      pathwayLoader: pathwayLoader,
      episode: episode,
      pathwayCallback: callBack
    });
    expect(callBack).toHaveBeenCalledWith({
      episode_id: 1,
      patient_id: 1,
      redirect_url: "somewhere"
    });
    expect($modalInstance.close).toHaveBeenCalledWith({
      episode_id: 1,
      patient_id: 1,
      redirect_url: "somewhere"
    });
  });

  it("should alert on failure", function(){
    var mockPathwayService = function(pathwaySlug, episode, isModal){
      this.open = function(){
        return {
          then: function(fn, otherFn){
            otherFn({
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

    var mockWindow = {alert: function(){}};
    spyOn(mockWindow, "alert");

    $controller("ModalPathwayMaker", {
      $scope: $scope,
      $modalInstance: $modalInstance,
      $injector: mockInjector,
      pathwaySlug: pathwaySlug,
      pathwayLoader: pathwayLoader,
      episode: episode,
      pathwayCallback: callBack,
      $window: mockWindow
    });

    expect($modalInstance.close).not.toHaveBeenCalled();
    expect(mockWindow.alert).toHaveBeenCalledWith("unable to save patient");
  });
});
