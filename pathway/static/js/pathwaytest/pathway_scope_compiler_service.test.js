describe('PathwayScopeCompiler', function() {
  "use strict";
  var scopeCompiler, ScopeCompiler, $rootScope, $httpBackend, Episode;
  var recordSchema = {
    'location': {
      name: 'location',
      single: true,
      fields: [
          {name: 'category', type: 'string'},
          {name: 'hospital', type: 'string'},
          {name: 'ward', type: 'string'},
          {name: 'bed', type: 'string'},
          {name: 'date_of_admission', type: 'date'},
          {name: 'tags', type: 'list'}
      ]
    },
    'diagnosis': {
      name: 'diagnosis',
      single: false,
      fields: [
          {name: 'condition', type: 'string'},
          {name: 'provisional', type: 'boolean'},
      ]
    }
  };

  beforeEach(function(){
    module('opal.services');

    inject(function($injector) {
      ScopeCompiler = $injector.get('PathwayScopeCompiler');
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');
      Episode = $injector.get('Episode');
    });
    $httpBackend.expectGET('/api/v0.1/metadata/').respond({
      someInfo: "something"
    });
    $httpBackend.expectGET('/api/v0.1/referencedata/').respond({
        someReferenceData: ["info"]
    });

    $httpBackend.expectGET('/api/v0.1/record/').respond(recordSchema);
    $httpBackend.expectGET('/api/v0.1/userprofile/').respond({});
    $rootScope.fields = recordSchema;
  });

  describe("compilePathwayScope", function(){
    it('should resolve reference data and metadata onto the scope', function(){
      var scope;
      scopeCompiler = new ScopeCompiler();
      scopeCompiler.compilePathwayScope().then(function(x){
        scope = x;
      });
      $httpBackend.flush();
      $rootScope.$apply();
      expect(scope.someReferenceData_list[0]).toBe("info");
      expect(scope.metadata.someInfo).toEqual("something");
    });

    it('should resolve episode data if supplied', function(){
      var scope;
      var episode = new Episode({
        id: 1,
        demographics:[
          {patient_id: 1}
        ],
        location: [
          {category: 'someCategory'}
        ],
        diagnosis: [
          {condition: 'someCondition'},
          {condition: 'someOtherCondition'}
        ],
      });
      scopeCompiler = new ScopeCompiler();
      scopeCompiler.compilePathwayScope(episode).then(function(x){
        scope = x;
      });
      $httpBackend.flush();
      $rootScope.$apply();
      expect(scope.editing.location.category).toEqual('someCategory');
      expect(scope.editing.diagnosis[0].condition).toEqual('someCondition');
    });

    it('should put the episode on the scope if supplied', function(){
      var scope;
      var episode = new Episode({
        id: 1,
        demographics:[
          {patient_id: 1}
        ]
      });
      scopeCompiler = new ScopeCompiler();
      scopeCompiler.compilePathwayScope(episode).then(function(x){
        scope = x;
      });
      $httpBackend.flush();
      $rootScope.$apply();
      expect(scope.episode).toEqual(episode);
    });
  });


});
