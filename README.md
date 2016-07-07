This is pathway - an [OPAL](https://github.com/openhealthcare/opal) plugin.

v0.2 changes:
  - we now use scope rather than controller as, if you want to add methods to your custom controller, put them on the scope. Other scopes can be referenced with scope.step and outside the form the current scope can be referenced with currentScope
  - we now use preSave on steps in the javascript rather than toSave this is to bring us inline with the Step object's api on the python side and the the preSave handle on the form controllers on the models
