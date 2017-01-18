describe("PathwayRedirectCtrl", function(){
  "use strict";
  var controller, $controller, fakeWindow;
  beforeEach(function(){
    module('opal.controllers');
    inject(function($injector){
      $controller = $injector.get('$controller')
    });
    fakeWindow = {location: {href: undefined}}
    controller = $controller("PathwayRedirectCtrl", {
      $window: fakeWindow
    });
  });

  it("should redirect to the root url", function(){
    expect(fakeWindow.location.href).toBe("/")
  });

});
