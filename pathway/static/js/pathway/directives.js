directives.directive("saveMultiple", function($parse, $rootScope, Referencedata){
  return {
    scope: {
      parentModel: "=saveMultiple",
      form_url: "=?saveMultipleFormUrl",
      display_name: "=?saveMultipleLabel",
      model_name: "=?saveMultipleModelName",
      initialiseEmpty: "=?initialiseEmpty"
    },
    templateUrl: "/templates/pathway/save_multiple.html",
    link: function(scope, element, attrs){
      var editingString = attrs.saveMultiple;

      if(!scope.model_name){
        scope.model_name = editingString.substr(editingString.indexOf(".")+1);
      }

      if(_.isUndefined(scope.initialiseEmpty)){
        scope.initialiseEmpty = true;
      }
      var getModel = $parse(scope.model_name);

      // hopefully we can do this nicer in future
      Referencedata.then(function(referencedata){
          _.extend(scope, referencedata.toLookuplists());
      });

      // pull the value off schema if its available
      var getSchemaField = function(name){
        fields = scope.$root.fields;
        if(!fields){
           throw "fields not loaded";
        }
        return fields[scope.model_name][name];
      }

      var requiredAttrs = {
        "form_url": "saveMultipleFormUrl",
        "display_name": "saveMultipleLabel"
      };

      _.each(requiredAttrs, function(jsName, schemaName){
        if(!scope[schemaName]){
          scope[schemaName] = getSchemaField(schemaName);
        }
      });

      // in pathways we save multiple models of the same type as arrays
      if(!_.isArray(scope.parentModel)){
          scope.parentModel = [scope.parentModel];
      }

      if(!scope.parentModel.length && scope.initialiseEmpty){
          scope.parentModel.push({});
      }

      // shallow copy not deep copy as angular copy can't
      // deal with moments
      scope.model = {'allModels': _.map(scope.parentModel, function(row){
          var result = {};
          result[scope.model_name] = row;
          return result;
      })};

      scope.remove = function($index){
          scope.model.allModels.splice($index, 1);
      };

      scope.addAnother = function(){
          scope.model.allModels.push({});
      };

      // deep watch any changes and when they're done
      // copy them onto the parent model
      scope.$watch("model.allModels", function(){
          var children = _.map(scope.model.allModels, function(someEditing){
              return getModel(someEditing);
          });
          scope.parentModel = children;
      }, true);
    }
  };
});

directives.directive("openPathway", function($parse, $rootScope, Referencedata, $modal){
  return {
    scope: false,
    link: function(scope, element, attrs){
      element.click(function(){
        $rootScope.state = "modal";
        var pathwaySlug = attrs.openPathway;
        return $modal.open({
        controller : 'ModalPathwayController',
        templateUrl: '/templates/pathway/pathway_detail.html',
        size       : 'lg',
        resolve    :  {
          episode: function(){ return scope.episode; },
          pathwaySlug: function(){ return pathwaySlug; },
        }
        }).result.then(function(episode){
            // if we're cancelling episode is set to undefined
            if(episode){
              $rootScope.state = 'normal';
              scope.episode = episode;
            }
        });
      });
    }
  };
});
