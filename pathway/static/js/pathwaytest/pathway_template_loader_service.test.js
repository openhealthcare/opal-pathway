describe('pathwayTemplateLoader', function() {
  var iterator, PathwayTemplateLoader, pathway_template_loader;
  var $rootScope, scope, pathway_insert, step_wrapper_template_url;
  var compileSpy, templateRequest;

  beforeEach(function(){
    iterator = 0;
    compileSpy = jasmine.createSpy('compileSpy').and.returnValue('compiled');
    templateRequest = jasmine.createSpy('templateRequest').and.returnValue({
      then: function(fn){
        iterator += 1;
        fn(String(iterator));
      }
    });

    module('opal.services', function($provide){
      $provide.service('$templateRequest', function(){
        return templateRequest;
      });
      $provide.service('$compile', function(){
        return function(){
          return compileSpy;
        };
      });
    });


    inject(function($injector) {
      PathwayTemplateLoader = $injector.get('PathwayTemplateLoader');
      $rootScope = $injector.get('$rootScope');
    });

    scope = $rootScope.$new();
    pathway_insert = ".pathway-insert";
    step_wrapper_template_url = "templates/template_wrapper_url";

    pathway_template_loader = new PathwayTemplateLoader(
      scope,
      ".pathway-insert",
      '.something',
      step_wrapper_template_url,
      [
        {
          template_url: 'step_1_template_url',
          scope: "scope1"
        },
        {
          template_url: 'step_2_template_url',
          scope: "scope2"
        }
      ]
    );
  });

  describe('_getStepTemplates', function(){
    it('should request promises for all the step templates and return their promises', function(){
      pathway_template_loader._getStepTemplates();
      expect(templateRequest).toHaveBeenCalled();
      expect(templateRequest.calls.argsFor(0)).toEqual(['step_1_template_url']);
      expect(templateRequest.calls.argsFor(1)).toEqual(['step_2_template_url']);
    });
  });

  describe('_populateTemplateCache', function(){
    it('should load in all the templates', function(){
      pathway_template_loader._populateTemplateCache();
      expect(templateRequest.calls.count()).toBe(4);
      $rootScope.$apply();
      expect(pathway_template_loader.cachedTemplates.baseTemplate).toBe("1");
      expect(pathway_template_loader.cachedTemplates.stepWrapper).toBe("2");
      expect(pathway_template_loader.cachedTemplates.stepTemplates).toEqual(["3", "4"]);
    });
  });

  describe('loadInSteps', function(){
    it('should load the steps templates into the template', function(){
      find = jasmine.createSpy('find spy');
      append = jasmine.createSpy('append spy');

      var pathwayTemplateSpy = {
        find: find.and.returnValue({
          append: append,
        })
      };

      pathway_template_loader.cachedTemplates.baseTemplate = "1";
      pathway_template_loader.cachedTemplates.stepWrapper = '<div><div class="something"></div></div>';
      pathway_template_loader.cachedTemplates.stepTemplates = ["3", "4"];
      pathway_template_loader._loadInSteps(pathwayTemplateSpy);
      expect(compileSpy.calls.count()).toBe(2);
      expect(compileSpy.calls.argsFor(0)).toEqual(['scope1']);
      expect(compileSpy.calls.argsFor(1)).toEqual(['scope2']);
      expect(append.calls.argsFor(0)).toEqual([['compiled', 'compiled']]);
    });
  });

  describe('loadInPathway', function(){
    it('should load in the pathway', function(){
      spyOn(pathway_template_loader, "_loadInSteps");
      append = jasmine.createSpy('append');
      spyOn(window, "$").and.returnValue({
        append: append,
        size: function(){ return 1; }
      });
      pathway_template_loader._loadInPathway();
      expect(append).toHaveBeenCalled()
      expect(pathway_template_loader._loadInSteps).toHaveBeenCalled();
    });

    it('should raise an error if its unable to find the pathway insert', function(){
      spyOn(pathway_template_loader, "_loadInSteps");
      append = jasmine.createSpy('append');
      spyOn(window, "$").and.returnValue({
        append: append,
        size: function(){ return 0; }
      });
      try{
        pathway_template_loader._loadInPathway();
      }
      catch(err){
        expect(err).toEqual("Unable to find base template to append to");
      }

      expect(append).not.toHaveBeenCalled();
      expect(pathway_template_loader._loadInSteps).not.toHaveBeenCalled();
    });
  });

  describe('load', function(){
    it('should call through', function(){
      spyOn(pathway_template_loader, "_populateTemplateCache").and.returnValue({
        then: function(fn){fn();}
      });
      spyOn(pathway_template_loader, "_loadInPathway");
      pathway_template_loader.load();
      expect(pathway_template_loader._populateTemplateCache).toHaveBeenCalled();
      expect(pathway_template_loader._loadInPathway).toHaveBeenCalled();
    });
  });
});
