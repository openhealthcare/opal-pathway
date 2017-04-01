### 0.4

Templates are now compiled on the server so must be referred to with "template" rather than "template_url".

Step template wrappers are no longer a thing.

The episode is compiled onto the pathway as an array.

If a model is a singleton then the client side is given a single item.

Alternatively you can use the SingleModelStep(model=yourModel) in your pathway. this will put the last subrecord of yourModel onto the scope.

the pathway save method now returns a tuple of patient, episode


### 0.3 Release

Significant API churn with contextualising and defining Pathways, Steps, et cetera.
See updated README for further details.

Targets Opal 0.8.x

### 0.2 Release

Targets Opal 0.7.x

### 0.1 Release

Initial release, still very alpha.

Targets Opal 0.6.x
