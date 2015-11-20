//
// Main OPAL Referrals plugin application!
//
var opalshim = OPAL.module('opal', [])

// can we remove this?
var services = OPAL.module('opal.pathway.services', []);

var pathway = OPAL.module('opal.multistage', []);

var controllers = OPAL.module('opal.pathway.controllers', [
    'opal.services',
    'opal.multistage',
    'opal.pathway.controllers',
    'opal.pathway.services'
]);

var app = OPAL.module('opal.pathway', [
    'ngRoute',
    'ngProgressLite',
    'ngCookies',
    'opal.filters',
    'opal.services',
    'opal.directives',
    'opal.controllers',
    'opal.multistage',
    'opal.pathway.controllers',
    'opal.pathway.services'
]);

OPAL.run(app);

app.config(function($routeProvider){
    $routeProvider
        .when('/', {
            controller: 'PathwayController',
            resolve: {},
            templateUrl: '/pathway/templates/pathwaydetail.html'
        })
        .when('/:pathway', {
            controller: 'PathwayController',
            resolve: {
                pathway: function(pathwayLoader){ return pathwayLoader(); },
            		options: function(Options) { return Options; },
            },
            templateUrl: '/pathway/templates/pathwaydetail.html'
        });
});
