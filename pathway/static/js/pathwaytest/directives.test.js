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

  describe('saveMultipleWrapper', function(){
      it('should populate child scope', function(){
          scope.editing = {greetings: [
            {salutation: "Hello!"},
            {salutation: "Hola!"}
          ]};
          var markup = '<div save-multiple-wrapper="editing.greetings"><div id="greeting" ng-repeat="editing in model.subrecords">[[ editing.salutation ]]</div></div>';
          element = $compile(markup)(scope);
          scope.$digest();
          var input = angular.element($(element).find("#greeting")[0]);
          var testScope = input.scope();
          expect(_.isFunction(testScope.addAnother)).toBe(true);
          expect(_.isFunction(testScope.remove)).toBe(true);
          expect(testScope.model.subrecords[0].greetings.salutation).toBe("Hello!");
          expect(testScope.model.subrecords[1].greetings.salutation).toBe("Hola!");
      });
  });
});
