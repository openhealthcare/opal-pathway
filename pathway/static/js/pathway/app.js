//
// Main OPAL Referrals plugin application!
//
var opalshim = OPAL.module('opal', [])

// can we remove this?
var services = OPAL.module('opal.pathway.services', []);

var controllers = OPAL.module('opal.referral.controllers', [
    'opal.services',
    'opal.multistage.services',
    'opal.pathway.services'
]);

var app = OPAL.module('opal.referral', [
    'ngRoute',
    'ngProgressLite',
    'ngCookies',
    'opal.filters',
    'opal.services',
    'opal.directives',
    'opal.controllers',
    'opal.pathway.controllers'
]);

OPAL.run(app);

app.config(function($routeProvider){
    $routeProvider
        .when('/', {
            controller: 'PathwayController',
            resolve: {},
            templateUrl: '/pathway/templates/pathway_detail.html'
        });
});
