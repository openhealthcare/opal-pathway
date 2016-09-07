directives.directive("saveMultipleWrapper", function($parse){
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
    transclude: true,
    template: '<div ng-transclude></div>',
    scope: {
      parentModel: "=saveMultipleWrapper",
      initialiseEmpty: "=?initialiseEmpty",
    },
    link: function(scope, element, attrs, ctrl, transclude){
      var sc = scope.$parent.$new();
      var editingString = attrs.saveMultipleWrapper;

      if(!sc.model_name){
        sc.model_name = editingString.substr(editingString.indexOf(".")+1);
      }

      if(_.isUndefined(sc.initialiseEmpty)){
        sc.initialiseEmpty = true;
      }
      var getModel = $parse(sc.model_name);

      // in pathways we save multiple models of the same type as arrays
      if(!_.isArray(scope.parentModel)){
          scope.parentModel = [scope.parentModel];
      }

      if(!scope.parentModel.length && sc.initialiseEmpty){
          scope.parentModel.push({});
      }

      // shallow copy not deep copy as angular copy can't
      // deal with moments
      sc.model = {'subrecords': _.map(scope.parentModel, function(row){
          var result = {};
          result[sc.model_name] = row;
          return result;
      })};

      sc.remove = function($index){
          sc.model.subrecords.splice($index, 1);
      };

      sc.addAnother = function(){
          sc.model.subrecords.push({});
      };

      // deep watch any changes and when they're done
      // copy them onto the parent model
      sc.$watch("model.subrecords", function(){
          var children = _.map(sc.model.subrecords, function(someEditing){
              return getModel(someEditing);
          });
          scope.parentModel = children;
      }, true);

      transclude(sc, function(clone, scope) {
          element.empty();
          element.append(clone);
      });
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
