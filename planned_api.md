## A Document discussing the planned api for pathways v0.3

### Pathway
A pathway is the term for the entire form, it has a slug from which its loaded. A template_url which is a form that provides the base.

This form is loaded with steps, the steps look up fields with ids equal to their step ids and are injected by js into these steps.

Usually in the template this will look something like

{% for step in steps %}
<div id="{{ step.get_id }}"></div>
{% endfor %}

Some standard pathways are provided

#### A Staged Pathway
A staged pathway contains a number of different steps but only displays the current steps. There's a list of process steps at the top, marked by the icon of the step (if there's a model by default it will pull this off the model)

#### An Unrolled Pathway
A flat form of multiple steps, each with isolated scopes allowing custon logic

#### A Modal Pathway
An unrolled pathway in a modal box


### Steps

#### Introduction

we have  a step, a step is the unit of a pathway, it can have a preSave step, it can a template and it can have a controller.
Usually basic steps are provided for you, you want a simple couple of model forms in your pathway you can use

```python
from pathway import pathways
from myapp import models

class SimplePathway(pathways.Pathway):
    display_name = 'A simple pathway'
    slug         = 'simples'
    steps        = (
        models.Allergies,
        models.Treatment,
        models.PastMedicalHistory
    )
```

steps when they are just models are automatically wrapped in pathway.pathway.Step(model={{ your model }})

FAQ
I want to add in some custom logic when I save the pathway, just give your pathway step a Presave

define your own step for example
 class MyStep(Step):
   def pre_save(data, user, patient=None, episode=None):
   	# your custom logic

data in this case is all  of the data passed to the pathway after the save.

I want to add in a custom template
 just add a template_url to your step e.g.
class MyStep(Step):
  template_url = “/templates/pathway/something.html”

of pass it in as an argument e.g.

```python
class SimplePathway(pathways.Pathway):
    display_name = 'A simple pathway'
    slug         = 'simples'
    steps        = (
        Step(model=models.Treatment, template_url=“/templates/pathway/something.html”
    )
```

I want to add a custom controller add in a controller class for example

```python
  steps = (
    Step(model=models.Treatment, contoller_class=“MyFancyController”
  )
```

your controller is passed scope, step and episode e.g.


```javascript
angular.module(‘opal.controllers’).controller(‘MyFancyController’, function(scope, step, episode){});
```

scope is a unique scope for that controller, apart from scope.editing which is a shared scope through out all your scopes. By default it already has the reference data loaded onto the scope in the usual form ie {{ model_name.api_name }}_list. Metadata is loaded onto the scope as usual, ie scope.metadata.


If you’re the pathway is from an existing patient/episode these will be provided (a pathway is loaded with patient or episode depending on the url its loaded from, if its from [[ pathway_slug ]]/[[ patient_id ]]/[[ episode_id ]])

#### Step api hooks
The step controllers come built with a number of methods used for flow control

##### preSave(editing)
Like the steps the javscript controller can implement a preSave step, taking in editing, which is the total editing object to be pushed to the server, allowing the object to be editing before we push it up to the server.

#### valid(editing)
Valid looks at the step and determines if its valid, if its valid the user can do to the next step or save

#### showNext(editing)
In staged pathways this shows the next button f its appropriate.

#### goNext()
This moves the pathway onto the next scope, allowing custom step skipping if the user wishes

#### hasPrevious
This determines whether the user can see the back button

#### hideFooter
This will hide the whole footer of a staged pathway


#### Provided Steps
 Step(model={{ some model }}), this is the step that will wrap any models passed into a step by default, it will use the last available record of that type if it exists, otherwise it will create one

 MultiSaveStep(model={{ }}), this step look will create a multi save step, a step that allows editing of all steps. It allows users to remove steps on the front end, by default these are not deleted on the backend, if you pass in delete_others=True as an argument any other records of this type that are attached to the episode will be removed. If you pass in initialise_empty=False, an empty additional model won’t be appended to the bottom of existing models (by default it is)


### Directives
(To be filled in)

### Templatetags
(To be filled in)
