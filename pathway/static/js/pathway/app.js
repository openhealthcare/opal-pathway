//
// Main OPAL Referrals plugin application!
//
var opalshim = OPAL.module('opal', [])

// can we remove this?
var services = OPAL.module('opal.services', []);

var pathway = OPAL.module('opal.multistage', []);

var controllers = OPAL.module('opal.controllers', [
    'opal.services',
    'opal.multistage',
    'opal.controllers',
    'opal.services'
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
                pathway: function(pathwayLoader){
                  return pathwayLoader($route.current.params.pathway);
                },
              	options: function(Options) { return Options; },
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
