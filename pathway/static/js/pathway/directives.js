directives.directive("saveMultipleWrapper", function($parse, Referencedata){
  /*
    a utility directive that allows us to code
    as if we had an array of editings and save
    them in a pathway appropriately
    it adds into the child scope

    models.subrecords an array of the appropriate models
    remove a function that takes in an index and will remove that from the array
    addAnother a function that will add another to an array

    by default it will add an empty model if there isn't one already

    example usage

    <div save-multiple-wrapper="editing.treatment">
      <div ng-repeat="editing in model.subrecords">
        {% input field="Treatment.drug" %}
        <button ng-click="remove($index)"></button>
      </div>

      <button ng-click="addAnother()"></button>
    </div>
  */
  return {
    scope: {
      parentModel: "=saveMultipleWrapper",
      initialiseEmpty: "=?initialiseEmpty",
    },
    transclude: true,
    template: '<div ng-transclude></div>',
    link: function(scope, element, attrs, ctrl, transclude){
      var editingString = attrs.saveMultipleWrapper;

      if(!scope.model_name){
        scope.model_name = editingString.substr(editingString.indexOf(".")+1);
      }

      if(_.isUndefined(scope.initialiseEmpty)){
        scope.initialiseEmpty = true;
      }
      var getModel = $parse(scope.model_name);

      // in pathways we save multiple models of the same type as arrays
      if(!_.isArray(scope.parentModel)){
          scope.parentModel = [scope.parentModel];
      }

      if(!scope.parentModel.length && scope.initialiseEmpty){
          scope.parentModel.push({});
      }

      // shallow copy not deep copy as angular copy can't
      // deal with moments
      scope.model = {'subrecords': _.map(scope.parentModel, function(row){
          var result = {};
          result[scope.model_name] = row;
          return result;
      })};

      scope.remove = function($index){
          scope.model.subrecords.splice($index, 1);
      };

      scope.addAnother = function(){
          scope.model.subrecords.push({});
      };

      // hopefully we can do this nicer in future
      Referencedata.then(function(referencedata){
          _.extend(scope, referencedata.toLookuplists());
      });

      // deep watch any changes and when they're done
      // copy them onto the parent model
      scope.$watch("model.subrecords", function(){
          var children = _.map(scope.model.subrecords, function(someEditing){
              return getModel(someEditing);
          });
          scope.parentModel = children;
      }, true);

      transclude(scope, function(clone, scope) {
          element.empty();
          element.append(clone);
      });
    }
  };
});

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
      scope.model = {'subrecords': _.map(scope.parentModel, function(row){
          var result = {};
          result[scope.model_name] = row;
          return result;
      })};

      scope.remove = function($index){
          scope.model.subrecords.splice($index, 1);
      };

      scope.addAnother = function(){
          scope.model.subrecords.push({});
      };

      // deep watch any changes and when they're done
      // copy them onto the parent model
      scope.$watch("model.subrecords", function(){
          var children = _.map(scope.model.subrecords, function(someEditing){
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
