describe('PathwayBase', function() {
  "use strict";
  var pathway, PathwayBase;

  var pathwayDefinition = {
    'append_to': '.appendTo',
    'icon': undefined,
    'save_url': '/pathway/add_patient/sav',
    'service_class': 'PathwayBase',
    'steps': [
      {
        'controller_class': 'FindPatientCtrl',
        'icon': 'fa fa-user',
        'template_url': '/templates/pathway/find_patient_form.html',
        'title': 'Find Patient'
      },
      {
        'api_name': 'location',
        'controller_class': 'MultistageDefault',
        'icon': 'fa fa-map-marker',
        'template_url': '/templates/pathway/blood_culture_location.html',
        'title': 'Location'
      }
    ],
    'template_url': '/templates/pathway/wizard_pathway.html',
    'title': 'Add Patient'
  };

  beforeEach(function(){
    module('opal.services');
    inject(function($injector) {
      PathwayBase = $injector.get('PathwayBase');
    });
    pathway = new PathwayBase(pathwayDefinition);
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

    });

    it("should call initialise", function(){

    });
  });

  describe("initialise", function(){
    it("should set itself on the scope", function(){

    });

    it("should call through to create the steps", function(){

    });

    it("should call through to the template loader", function(){

    });
  });

  describe('createSteps', function(){
    it("should create add the step controller", function(){

    });

    it("should create the step scope", function(){

    });
  });

  describe('cancel', function(){
    it("should just resolve the form result", function(){

    });
  });

  describe('preSave', function(){
    it("should do nothing", function(){

    });
  });

  describe('valid', function(){
    it("should return itself", function(){
    });
  });

  describe('finish', function(){
    it("should handle the results when they're an array", function(){

    });

    it("should handle the results when they're a list", function(){

    });
  });
});
