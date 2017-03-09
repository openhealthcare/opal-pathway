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
    },
    link: function(scope, element, attrs, ctrl, transclude){
      var sc = scope.$parent.$new();
      var editingString = attrs.saveMultipleWrapper;

      if(!sc.model_name){
        sc.model_name = editingString.substr(editingString.indexOf(".")+1);
      }

      var getModel = $parse(sc.model_name);

      // in pathways we save multiple models of the same type as arrays
      if(!_.isArray(scope.parentModel)){
          if(!scope.parentModel){
            scope.parentModel = [{}];
          }
          else{
            scope.parentModel = [scope.parentModel];
          }
      }

      sc.model = {subrecords: []};

      // make sure these don't override the controller
      if(!sc.remove){
        sc.remove = function($index){
            sc.model.subrecords.splice($index, 1);
        };
      }

      if(!sc.addAnother){
        sc.addAnother = function(){
            var newModel = {};
            newModel[sc.model_name] = {};
            sc.model.subrecords.push(newModel);
        };
      }
      var updateParent = true;
      var updateChild = true;

      sc.$watchCollection(attrs.saveMultipleWrapper, function(){
        if(updateParent){
          updateChild = false;
          sc.model.subrecords.splice(0, sc.model.subrecords.length);
          _.each(scope.parentModel, function(pm){
              var editing = {};
              editing[sc.model_name] = pm;
              sc.model.subrecords.push(editing);
          });
          updateChild = true;
        }
      });

      // deep watch any changes and when they're done
      // copy them onto the parent model
      sc.$watchCollection("model.subrecords", function(){
        if(updateChild){
          updateParent = false;
          var children = _.map(sc.model.subrecords, function(someEditing){
              return getModel(someEditing);
          });

          scope.parentModel.splice(0, scope.parentModel.length);
          _.each(children, function(child){
            scope.parentModel.push(child);
          });
          updateParent = true;
        }
      });

      transclude(sc, function(clone, scope) {
          element.empty();
          element.append(clone);
      });
    }
  };
});

directives.directive("pathwayStep", function($controller, $parse){
  var controller =  function ($scope) {
    debugger;
    // var index = $parse($scope, "pathwayStep")();
    // step = $scope.pathway.steps[index];
    // stepController = $controller(
    //   step.step_controller,
    //   {
    //     step: step,
    //     episode: $scope.episode
    //   }
    // );
    //
    // stepController.editing = $scope.pathway.editing;
    // _.extend($scope, stepController);
    // some sort of pathway.register
  };
  return {
      restrict: 'EA', //Default in 1.3+
      controller: controller,
  };
});

directives.directive("openPathway", function($parse, $rootScope, Referencedata, $modal, episodeLoader){
  /*
  * the open pathway directive will open a modal pathway for you
  * you can if you use the attribute pathway-callback="{{ some_function }}"
  * this function will get resolved with the result of pathway.save
  * it should return a function and will get resolved before the modal
  * closes
  */
  "use strict";

  return {
    scope: false,
    link: function(scope, element, attrs){
      $(element).click(function(e){
        e.preventDefault();
        var pathwayCallback;
        $rootScope.state = "modal";
        var pathwaySlug = attrs.openPathway;
        if(attrs.pathwayCallback){
          // we bind the parse to be able to use scope with us overriding
          // episode id in the function
          pathwayCallback = _.partial($parse(attrs.pathwayCallback), _, scope);
        }
        else{
          pathwayCallback = function(response){
            return episodeLoader(response.episode_id).then(function(episode){
              if(episode){
                scope.episode = episode;
              }
            });
          };
        }
        return $modal.open({
          controller : 'ModalPathwayMaker',
          templateUrl: '/templates/pathway/pathway_detail.html',
          size       : 'lg',
          resolve    :  {
            episode: function(){ return scope.episode; },
            pathwaySlug: function(){ return pathwaySlug; },
            pathwayCallback: function(){ return pathwayCallback; }
          }
        }).result.then(function(){
            $rootScope.state = 'normal';
        });
      });
    }
  };
});

directives.directive("requiredIfNotEmpty", function(){
  /*
  * if we are saving multiple models we want to add validation
  * for a field to be required but only if one of the fields
  * is actually filled in
  */
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {"requiredIfNotEmpty": "="},
    link: function(scope, ele, attrs, ctrl){
      var validate = function(value){
        var valid;
        if(value){
          valid = true
        }
        else{
          valid = !_.find(scope.requiredIfNotEmpty, function(v, k){
            // can't use startswith because of phantomjs, but this does
            // the same trick
            return (k.indexOf("$$") !== 0) && v
          });
        }

        ctrl.$setValidity('requiredIfNotEmpty', valid);
        return valid;
      }

      scope.$watch("requiredIfNotEmpty", function(){
        validate(ctrl.$viewValue);
      }, true);

      ctrl.$validators.requiredIfNotEmpty = function(value){
        var valid = validate(value);
        ctrl.$setValidity('requiredIfNotEmpty', valid);
        return valid;
      };
    }
  }
});
