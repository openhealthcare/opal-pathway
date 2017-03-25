describe('Pathway', function() {
  "use strict";
  var pathway, Pathway, $httpBackend, PathwayScopeCompiler, $rootScope;
  var FieldTranslater, pathwayScope;

  var pathwayDefinition = {
    icon: undefined,
    save_url: '/pathway/add_patient/sav',
    pathway_service: 'Pathway',
    finish_button_icon: "fa fa-save",
    finish_button_text: "Save",
    steps: [
      {
        'step_controller': 'FindPatientCtrl',
        'icon': 'fa fa-user',
        'template_url': '/templates/pathway/find_patient_form.html',
        'title': 'Find Patient'
      },
      {
        'api_name': 'location',
        'step_controller': 'DefaultStep',
        'icon': 'fa fa-map-marker',
        'template_url': '/templates/pathway/blood_culture_location.html',
        'title': 'Location'
      }
    ],
    display_name: 'Add Patient'
  };

  beforeEach(function(){
    PathwayScopeCompiler = function(){};
    module('opal.controllers');
    inject(function($injector) {
      Pathway = $injector.get('Pathway');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      FieldTranslater = $injector.get('FieldTranslater');
    });

    pathwayScope = $rootScope.$new();
    pathwayScope.$digest();
    pathway = new Pathway(pathwayDefinition);
    _.each(pathway.steps, function(step){
      step.scope = $rootScope.$new();
    });
  });

  describe("constructor", function(){
    it('should initialise the pathway properties', function(){
      expect(pathway.save_url).toEqual("/pathway/add_patient/sav");
      expect(pathway.display_name).toEqual(pathwayDefinition.display_name);
      expect(pathway.icon).toEqual(pathwayDefinition.icon);
      expect(pathway.finish_button_text).toEqual(pathwayDefinition.finish_button_text);
      expect(pathway.finish_button_icon).toEqual(pathwayDefinition.finish_button_icon);
    });
  });

  describe('createSteps', function(){
    it("should create add the step controller and scopes", function(){
      expect(pathway.steps.length).toBe(2);
      expect(!!pathway.steps[0].step_controller).toBe(true);
      expect(!!pathway.steps[1].step_controller).toBe(true);
    });
  });

  describe('cancel', function(){
    it("should just resolve the form result", function(){
      var called = false;
      var args = undefined;
      var result = pathway.pathwayPromise;
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
      var result;
      var response = pathway.pathwayPromise;
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
      var result;
      var response = pathway.pathwayPromise;
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
