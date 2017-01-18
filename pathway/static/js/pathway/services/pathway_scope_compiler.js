angular.module('opal.services').service('PathwayScopeCompiler', function(
  $q, $rootScope, Metadata, Referencedata, recordLoader
){
  /*
  * the pathway scope compiler brings in the episode, the referencedata,
  * the metadata and the episode (if available)
  * it then compiles the episode onto the scope
  */

  var ScopeCompiler = function(){
  };

  ScopeCompiler.prototype = {
    resolvePromises: function(scope){
      var toResolve = $q.defer();
      var promises = [Metadata, Referencedata];
      $q.all(promises).then(function(data){
        scope.metadata = data[0];
        _.extend(scope, data[1].toLookuplists());
        toResolve.resolve(scope);
      });

      return toResolve.promise;
    },
    loadEpisodeIntoEditing: function(episode){
      result = recordLoader.then(function(schema){
        var editing = {};
        _.each(_.keys(schema), function(key){
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
      }, this);

      return result;
    },
    compilePathwayScope: function(episode){
      var self = this;
      var scopeCreated = $q.defer();
      var scope = $rootScope.$new();
      var promisesResolved = this.resolvePromises(scope);
      promisesResolved.then(function(scope){
        if(episode){
          self.loadEpisodeIntoEditing(episode).then(function(editing){
              scope.editing = editing;
              scopeCreated.resolve(scope);
          })
        }
        else{
            scope.editing = {};
            scopeCreated.resolve(scope);
        }
      });
      return scopeCreated.promise;
    }
  };

  return ScopeCompiler;
});
