angular.module('opal.services').service('PathwayScopeCompiler', function(
  $q, $rootScope
){
  /*
  * the pathway scope compiler brings in the episode, the referencedata,
  * the metadata and the episode (if available)
  * it then compiles the episode onto the scope
  */

  var ScopeCompiler = function(){
  };

  ScopeCompiler.prototype = {
    loadEpisodeIntoEditing: function(episode){
      var editing = {};
      _.each(_.keys($rootScope.fields), function(key){
          var copies = _.map(
              episode[key],
              function(record){
                  return record.makeCopy();
              });
          if(copies.length > 1){
              editing[key] = copies;
          }
          else if(copies.length === 1){
              editing[key] = copies[0];

          }else{
              editing[key] = {};
          }
      });
      return editing;
    },
    compilePathwayScope: function(episode){
      var self = this;
      var scopeCreated = $q.defer();
      var scope = $rootScope.$new();
      if(episode){
        return self.loadEpisodeIntoEditing(episode);
      }
      else{
        scope.editing = {};
      }
    }
  };

  return ScopeCompiler;
});
