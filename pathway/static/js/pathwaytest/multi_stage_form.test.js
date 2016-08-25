describe('multi stage form', function(){
  "use strict";
  var $httpBackend, multistage, $rootScope;

  var get_pathway = function(){
    return {
      append_to: '.append_to',
      icon: null,
      save_url: '/pathway/pathway_slug/patient_id/episode_id',
      title: 'Test Pathway',
      steps: [{
        icon: "fa fa-something",
        api_name: "some_model_api_name",
        title: "Some Model Form"
      }]
    };
  };

  beforeEach(module('opal.controllers', function($provide){
    $provide.service('$templateRequest', function(){
      return function(){
        return "<div class='append_to'></div>";
      };
    });
  }));

  beforeEach(inject(function($injector){
      multistage = $injector.get('multistage');
      $httpBackend  = $injector.get('$httpBackend');
      $rootScope  = $injector.get('$rootScope');
  }));

  describe('test open pathway', function(){
    it('should load in resources', function(){
        spyOn(multistage, 'injectTemplates');
        var result = multistage.open(get_pathway());
        $httpBackend.expectGET('/api/v0.1/metadata/').respond({});
        $httpBackend.expectGET('/api/v0.1/referencedata/').respond({});
        $rootScope.$apply();
        $httpBackend.flush();
    });
  });
});
