//
// Main OPAL Referrals plugin application!
//
var opalshim = OPAL.module('opal', [])

var pathway = OPAL.module('opal.multistage', []);

var app = OPAL.module('opal.pathway', [
    'ngRoute',
    'ngProgressLite',
    'ngCookies',
    'opal.filters',
    'opal.services',
    'opal.directives',
    'opal.controllers',
    'opal.multistage',
    'opal.controllers',
    'opal.services'
]);

OPAL.run(app);

app.config(function($routeProvider){
    $routeProvider
        .when('/', {
            controller: 'PathwayController',
            resolve: {},
            templateUrl: '/pathway/templates/pathwaydetail.html'
        })
        .when('/:pathway/:episode_id?', {
            controller: 'PathwayController',
            resolve: {
              	referencedata: function(Referencedata) { return Referencedata; },
                episode: function($route, episodeLoader){
                    if(!$route.current.params.episode_id){
                        return null;
                    }
                    return episodeLoader($route.current.params.episode_id);
                }
            },
            templateUrl: function(params){
                return '/pathway/templates/' + params.pathway + '/detail.html'
            }
        });
});
