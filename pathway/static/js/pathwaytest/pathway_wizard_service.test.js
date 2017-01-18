describe('WizardPathway', function() {
  "use strict";
  var pathway, WizardPathway, $httpBackend, PathwayScopeCompiler, $rootScope;
  var pathwayScope, $q, pathwayTemplateLoader;

  var pathwayDefinition = {
    'append_to': '.appendTo',
    'icon': undefined,
    'save_url': '/pathway/add_patient/sav',
    'service_class': 'WizardPathway',
    'steps': [
      {
        'controller_class': 'DefaultStep',
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
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      WizardPathway = $injector.get('WizardPathway');
      $q = $injector.get('$q');
      pathwayTemplateLoader = $injector.get('pathwayTemplateLoader');
    });

    pathwayScope = $rootScope.$new();
    var deferred = $q.defer();
    deferred.resolve(pathwayScope);
    PathwayScopeCompiler.prototype.compilePathwayScope = function(){};
    spyOn(PathwayScopeCompiler.prototype, 'compilePathwayScope').and.returnValue(
      deferred.promise
    );

    spyOn(pathwayTemplateLoader, 'load');
    pathway = new WizardPathway(pathwayDefinition);
    pathway.open();
    pathwayScope.$apply();
  });

  describe("initialise", function(){
    it("should setup additional variables on initilisation", function(){
      expect(pathway.numSteps).toBe(2);
      expect(pathway.currentStep).toEqual(pathway.steps[0]);
      expect(pathway.currentScope).toEqual(pathway.steps[0].scope);
      expect(pathway.currentIndex).toBe(0);
    });
  });

  describe("hasNext", function(){
    it("it should return false if there are no more steps", function(){
      pathway.currentIndex = 1;
      expect(pathway.hasNext()).toBe(false);
    });
    it("it should return true if there are more steps", function(){
      expect(pathway.hasNext()).toBe(true);
    });
  });

  describe("hasPrevious", function(){
    it("should return true if there are previous steps", function(){
      pathway.currentIndex = 1;
      expect(pathway.hasPrevious()).toBe(true);
    });

    it("should return false if there aren't previous steps", function(){
      expect(pathway.hasPrevious()).toBe(false);
    });
  });

  describe("next", function(){
    it("should add to the currentIndex", function(){
      expect(pathway.next()).toBe(1);
    });
  });

  describe("previous", function(){
    it("should subtract from the currentIndex", function(){
      pathway.currentIndex = 1;
      expect(pathway.previous()).toBe(0);
    });
  });

  describe("goNext", function(){
    it("should move current variables to the next step", function(){
      pathway.goNext({});
      expect(pathway.currentIndex).toBe(1);
      expect(pathway.currentStep).toEqual(pathway.steps[1]);
      expect(pathway.currentScope).toEqual(pathway.steps[1].scope);
    });
  });

  describe("goPrevious", function(){
    it("should move current variables to the next step", function(){
      pathway.goNext({});
      pathway.goPrevious({});
      expect(pathway.currentIndex).toBe(0);
      expect(pathway.currentStep).toEqual(pathway.steps[0]);
      expect(pathway.currentScope).toEqual(pathway.steps[0].scope);
    });
  });

  describe("showNext", function(){
    it("should return true", function(){
      expect(pathway.showNext({})).toBe(true);
    });
  });

  describe("stepTemplateWrapper", function(){
    it("should wrap the returned html", function(){
      var result = pathway.stepTemplateWrapper("<a>something</a>", 0);
      expect(result).toEqual(
        "<div ng-if='pathway.currentIndex === 0'><a>something</a></div>"
      );
    });
  });
});
