describe('app', function() {
    "use strict";

    var $route;
    var metadata;
    var recordLoader;
    var referencedata;
    var eLoader;
    var pathwayLoader;

    beforeEach(function(){
      eLoader = jasmine.createSpy().and.returnValue('episode');
      module('opal.pathway', function($provide){
        $provide.service('episodeLoader', function(){
            return eLoader;
        });
      });
      metadata = {load: function(){}};
      recordLoader = {load: function(){}};
      referencedata = {load: function(){}};
      pathwayLoader = {load: function(){}};
      spyOn(metadata, "load").and.returnValue("some metadata");
      spyOn(recordLoader, "load").and.returnValue("some record data");
      spyOn(referencedata, "load").and.returnValue("some reference data");
      spyOn(pathwayLoader, "load").and.returnValue("some pathway");

      inject(function($injector){
        $route = $injector.get('$route');
      });
    });

    describe('/', function() {
        it('should load Metadata', function() {
            var routed = $route.routes['/'];
            expect(metadata.load).not.toHaveBeenCalled();
            expect(referencedata.load).not.toHaveBeenCalled();
            expect(eLoader).not.toHaveBeenCalled();
            expect(routed.templateUrl).toEqual("/templates/loading_page.html");
            expect(routed.controller).toEqual("PathwayRedirectCtrl");
        });
    });

    describe('/:pathway/:patient_id?/:episode_id?', function() {
        it('should resolve with episode id', function() {
            var fakeRoute = {current: {params: {episode_id: 1}}};
            var routed = $route.routes['/:pathway/:patient_id?/:episode_id?'];
            var resolve = routed.resolve;
            expect(resolve.episode(fakeRoute, eLoader)).toEqual('episode');
            expect(eLoader).toHaveBeenCalledWith(1);
            expect(resolve.metadata(metadata)).toBe("some metadata");
            expect(resolve.referencedata(referencedata)).toBe("some reference data");
            expect(resolve.recordLoader(recordLoader)).toEqual("some record data");
            expect(resolve.pathwayDefinition(fakeRoute, pathwayLoader)).toBe("some pathway");
            expect(routed.templateUrl({pathway: "something"})).toBe("/pathway/templates/something.html");
        });
    });
});
