describe('Pathway', function() {
  "use strict";
  var pathway, Pathway, $httpBackend, PathwayScopeCompiler, $rootScope;
  var FieldTranslater, pathwayScope;

  var pathwayDefinition = {
    'append_to': '.appendTo',
    'icon': undefined,
    'save_url': '/pathway/add_patient/sav',
    'service_class': 'Pathway',
    'steps': [
      {
        'controller_class': 'FindPatientCtrl',
        'icon': 'fa fa-user',
        'template_url': '/templates/pathway/find_patient_form.html',
        'title': 'Find Patient'
      },
      {
        'api_name': 'location',
        'controller_class': 'DefaultStep',
        'icon': 'fa fa-map-marker',
        'template_url': '/templates/pathway/blood_culture_location.html',
        'title': 'Location'
      }
    ],
    'template_url': '/templates/pathway/wizard_pathway.html',
    'title': 'Add Patient'
  };

  beforeEach(function(){
    PathwayScopeCompiler = function(){};
    module('opal.services', function($provide){
        $provide.service('PathwayScopeCompiler', function(){
            return PathwayScopeCompiler;
        });
    });
    module('opal.controllers');
    inject(function($injector) {
      Pathway = $injector.get('Pathway');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      FieldTranslater = $injector.get('FieldTranslater');
    });

    pathwayScope = $rootScope.$new();
    pathwayScope.$digest();
    PathwayScopeCompiler.prototype.compilePathwayScope = function(){}
    spyOn(PathwayScopeCompiler.prototype, 'compilePathwayScope').and.returnValue({then: function(fn){
      fn(pathwayScope);
    }});
    pathway = new Pathway(pathwayDefinition);
  });

  describe("constructor", function(){
    it('should initialise the pathway properties', function(){
      expect(pathway.save_url).toEqual("/pathway/add_patient/sav");
      expect(pathway.stepDefinitions).toEqual(pathwayDefinition.steps);
      expect(pathway.template_url).toEqual(pathwayDefinition.template_url);
      expect(pathway.append_to).toEqual(pathwayDefinition.append_to);
      expect(pathway.title).toEqual(pathwayDefinition.title);
      expect(pathway.icon).toEqual(pathwayDefinition.icon);
    });
  });

  describe("open", function(){
    it("should return the form result promise", function(){
      var response = pathway.open();
      expect(!!response.then).toBe(true);
    });

    it("should call initialise", function(){
      spyOn(pathway, "initialise").and.returnValue();
      var response = pathway.open();
      expect(pathway.initialise).toHaveBeenCalled();
    });
  });

  describe("initialise", function(){
    it("should set itself on the scope", function(){
      pathway.open();
      expect(PathwayScopeCompiler.prototype.compilePathwayScope).toHaveBeenCalled();
      expect(!!pathwayScope.pathway).toBe(true);
    });

  });

  describe('createSteps', function(){
    it("should create add the step controller and scopes", function(){
      pathway.open();
      expect(pathway.steps.length).toBe(2);
      expect(!!pathway.steps[0].controller).toBe(true);
      expect(!!pathway.steps[1].controller).toBe(true);
      expect(pathway.steps[0].scope.$parent).toEqual(pathwayScope);
      expect(pathway.steps[1].scope.$parent).toEqual(pathwayScope);
    });
  });

  describe('cancel', function(){
    it("should just resolve the form result", function(){
      spyOn(pathway, "initialise").and.returnValue();
      var called = false;
      var args = undefined;
      var result = pathway.open();
      result.then(function(){
        called = true;
        args = arguments;
      });
      pathway.cancel();
      pathwayScope.$apply();
      expect(called).toBe(true);
      expect(args.length).toBe(1);
      expect(args[0]).toBe(undefined);
    });
  });

  describe('preSave', function(){
    it("should do nothing", function(){
      var editing = {};
      pathway.preSave(editing);
      expect(editing).toEqual({});
    });
  });

  describe('valid', function(){
    it("should return itself", function(){
      var editing = {};
      expect(pathway.valid(editing)).toBe(true);
    });
  });

  describe('finish', function(){
    beforeEach(function(){
      spyOn(FieldTranslater, "jsToSubrecord").and.returnValue({
        "interesting": true
      });
    });

    it("should handle the results when they're an array", function(){
      var editing = {"something": [
        {
          "interesting": true
        },
        {
          "interesting": true
        }
      ]};
      spyOn(pathway, "initialise").and.returnValue();
      var result;
      var response = pathway.open();
      response.then(function(x){
        result = x;
      });
      pathway.finish(editing);
      $httpBackend.expectPOST('/pathway/add_patient/sav', editing).respond("success");
      pathwayScope.$apply();
      $httpBackend.flush();
      expect(result).toEqual('success')
    });

    it("should handle the results when they're a single item", function(){
      var editing = {"something": {
          "interesting": true
      }};
      var expected = {"something": [{
          "interesting": true
      }]};
      spyOn(pathway, "initialise").and.returnValue();
      var result;
      var response = pathway.open();
      response.then(function(x){
        result = x;
      });
      pathway.finish(editing);
      $httpBackend.expectPOST('/pathway/add_patient/sav', expected).respond("success");
      pathwayScope.$apply();
      $httpBackend.flush();
      expect(result).toEqual('success')
    });
  });
});
