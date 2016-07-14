var directives = angular.module('opal.directives', []);

directives.directive("saveMultiple", function($parse, $rootScope){
  return {
    scope: {
      parentModel: "=saveMultiple",
    },
    templateUrl: "/templates/pathway/save_multiple.html",
    link: function(scope, element, attrs){
      var editingString = attrs.saveMultiple;
      var model = editingString.substr(editingString.indexOf(".")+1);
      var getModel = $parse(model);

      // pull the value off schema if its available
      var getSchemaField = function(name){
        fields = scope.$root.fields;
        if(!fields){
           throw "fields not loaded";
        }
        return fields[model][name];
      }

      var requiredAttrs = {
        "form_url": "saveMultipleformUrl",
        "display_name": "saveMultipleLabel"
      };

      _.each(requiredAttrs, function(jsName, schemaName){
        if(attrs[jsName]){
          scope[schemaName] = attrs[jsName];
        }
        else{
          scope[schemaName] = getSchemaField(schemaName);
        }
      });

      // in pathways we save multiple models of the same type as arrays
      if(!_.isArray(scope.parentModel)){
          scope.parentModel = [scope.parentModel];
      }

      if(!scope.parentModel.length){
          scope.parentModel.push({});
      }

      // shallow copy not deep copy as angular copy can't
      // deal with moments
      scope.model = {'allModels': _.clone(scope.parentModel)};

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
