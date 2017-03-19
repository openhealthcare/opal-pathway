angular.module('opal.controllers').controller(
  "DefaultStep", function(scope, step, episode){
    scope.greeting = {hello: "hello", there: "what"};
    scope.changeGreeting = function(){
      scope.greeting.there = "hello";
    };

    scope.$watch("greeting.there", function(){
      if(scope.greeting.there === "hello"){
        scope.greeting.hello = "boom";
      }
    });
  }
);
