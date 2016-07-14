describe('OPAL Directives', function(){
  "use strict";

  var element, scope, $httpBackend;

  beforeEach(module('opal.directives'));

  beforeEach(inject(function($rootScope, $compile, $injector) {
      scope = $rootScope.$new();
      $httpBackend = $injector.get('$httpBackend');
  }));

  function compileDirective(tpl){
      // inject allows you to use AngularJS dependency injection
      // to retrieve and use other services
      inject(function($compile) {
          element = $compile(tpl)(scope);
      });

      // $digest is necessary to finalize the directive generation
      scope.$digest();
  }

  describe('saveMultiple', function(){
      it('should request markup', function(){
          var markup = '<div save-multiple="editing.diagnosis"></div>';
          $httpBackend.expectGET('/templates/pathway/save_multiple.html').respond("");
          compileDirective(markup);
      });
  });


});
