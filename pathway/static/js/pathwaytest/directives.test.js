describe('OPAL Directives', function(){
  "use strict";

  var element, scope, $httpBackend, $compile;

  beforeEach(module('opal.directives', function($provide){
      $provide.value('Referencedata', function(){
          return {
            then: function(fn){ fn({ toLookuplists: function(){ return {}; } }); }
          };
      });
  }));

  beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      $httpBackend = $injector.get('$httpBackend');
      $compile = $injector.get('$compile');
  }));

  describe('saveMultiple', function(){
      it('should request markup', function(){
          var markup = '<div save-multiple="editing.diagnosis"></div>';
          $httpBackend.expectGET('/templates/pathway/save_multiple.html').respond("");
          element = $compile(markup)(scope);
          scope.$digest();
      });
  });
});
