describe('ModalPathwayCtrl', function() {
  "use strict";
  var $scope,  $controller, controller, metadata;
  var referencedata, pathwayDefinition, pathwayCallback;
  var $modalInstance, $window;

  beforeEach(function(){
    module('opal.controllers');
    referencedata = jasmine.createSpyObj(["toLookuplists"]);
    referencedata.toLookuplists.and.returnValue({some: "data"});
    $modalInstance = jasmine.createSpyObj(["close"]);

    var _$injector;
    inject(function($injector){
      var $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');
      $window = $injector.get('$window');
    });

    pathwayDefinition = {
      pathway_service: "Pathway"
    };

    metadata = {"fake": "metadata"};
    pathwayCallback = jasmine.createSpy();

    $controller('ModalPathwayCtrl', {
      $scope: $scope,
      episode: null,
      referencedata: referencedata,
      metadata: metadata,
      pathwayDefinition: pathwayDefinition,
      $modalInstance: $modalInstance,
      pathwayCallback: pathwayCallback,
      $window: $window
    });
  });

  it('should put metadata on to the scope', function(){
    expect($scope.metadata).toEqual(metadata);
  });

  it('should put referencedata on to the scope', function(){
    expect($scope.some).toBe("data");
    expect(referencedata.toLookuplists).toHaveBeenCalled();
  });

  it('should close the instance if the call back returns a promise', function(){
    pathwayCallback.and.returnValue({
      then: function(fn){ fn("something"); }
    });
    $scope.pathway.pathwayResult.resolve("done");
    $scope.$apply();
    expect(pathwayCallback).toHaveBeenCalledWith("done");
    expect($modalInstance.close).toHaveBeenCalledWith("something");
  });

  it('should close the instance if the call back returns a string', function(){
    pathwayCallback.and.returnValue("something");
    $scope.pathway.pathwayResult.resolve("done");
    $scope.$apply();
    expect(pathwayCallback).toHaveBeenCalledWith("done");
    expect($modalInstance.close).toHaveBeenCalledWith("something");
  });

  it('should close the instance if the call back is rejected', function(){
    spyOn($window, "alert");
    pathwayCallback.and.returnValue("something");
    $scope.pathway.pathwayResult.reject("done");
    $scope.$apply();
    expect($window.alert).toHaveBeenCalledWith("unable to save patient");
  });

});
