OPAL Pathway provides developers with a highly extensible method of
working with complex forms in [OPAL](https://github.com/openhealthcare/opal).
It provides Wizards, long multi-model forms, custom validation and much more,
all usable either in full page or modal contexts.

[![Build
Status](https://travis-ci.org/openhealthcare/opal-pathway.png?branch=v0.2)](https://travis-ci.org/openhealthcare/opal-pathway)
[![Coverage Status](https://coveralls.io/repos/github/openhealthcare/opal-pathway/badge.svg?branch=v0.2)](https://coveralls.io/github/openhealthcare/opal-pathway)


# What is a pathway?

A pathway is a set of steps and a step is one or more forms with the option of a custom controller.

The Pathways ship with wizard style and single page pathways, either for use in a new page or in a modal.

Pathways are an OPAL Discoverable feature, so we expect your pathway definitions to be in
a python module named `pathways.py` inside a Django App. Individual pathways are defined by subclassing the `pathways.Pathway` class. We must set at least the display name, and
often want to also set a slug.

```python
from pathway import pathways

class MyPathway(pathways.PagePathway):
    display_name = 'My Awesome Pathway'
    slug         = 'awesomest-pathway'
```


# What is a step?
A pathway is made up of 1-n `Steps`. These are defined on the pathway class using the
`Pathway.steps` tuple.

In the simplest case, we can simply add OPAL `Subrecords` to this tuple, and the Pathway will use the default form from `Subrecord.get_form_template`.

For instance, to create a simple wizard style pathway with three steps to record a
patient's allergies, treatment and past medical history, we could use the following:

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

You could access this pathway from e.g. `http://localhost:8000/pathway/#/simples/`.
or for a specifci episode `http://localhost:8000/pathway/#/simples/{{ patient_id }}/{{ episode_id }}`


If you want to add any custom save logic for your step, you can put in a `pre_save` method. This is passed the full data dictionary that has been received from the client and the patient and episode that the pathways been saved for, if they exist (If you're saving a pathway for a new patient/episode, they won't have been created at this time).

### Steps with multiple instances of records

Sometimes we may want to add multiple instances of a subrecord at the same time, for example when we're recording multiple allergies. To add a multiple step simply use a MultiSaveStep, for example:

```python
from pathway import pathways
from myapp import models

class SimplePathway(pathways.Pathway):
    display_name = 'A simple pathway'
    slug         = 'simples'
    steps        = (
        pathways.MultiSaveStep(model=models.Allergies),
        models.Treatment,
        models.PastMedicalHistory
    )
```

By default `MultiSaveStep` won't delete instances of subrecords, it will only edit or create.

If you wish the server to delete any instances of a subrecord that are not passed back (allowing the user a
delete option) then we set the `delete_existing` keyword argument to True. e.g.:

```python
 import pathways
 pathways.MultiSaveStep(model=models.Allergies, delete_existing=True)
```

In this case, the pathway will delete any existing instances of the given Subrecord Model that are not sent
back to the API in the JSON data.

### Complex steps - more than one subrecord type

If we want to save multiple types of subrecords at the same step, we can do that by including the
relevant form templates in a custom step template.

```python
from pathway import pathways
from myapp import models

class SimplePathway(pathways.Pathway):
    display_name = 'A simple pathway'
    slug         = 'simples'
    steps        = (
        pathways.Step(
            title='Demographics and Diagnosis',
            icon='fa fa-clock',
            template='pathways/demographics_and_diagnosis_step.html'
            ),
    )
```

The title and icon are rendered in the header for this step in your pathway, which exist outside the scope of the step template itself. Then all we would need is the template itself:

```html
<!-- pathways/demographics_and_diagnosis_step.html -->
{% include models.Demographics.get_form_template %}
{% include models.Diagnosis.get_form_template %}
```

#### Complex steps with multiple instances per subrecord

If we need to also save multiple types of the same subrecord e.g. `Treatment` in this step,
we simply use the `multisave` template tag.

```html
{% load pathways %}

{% include models.Demographics.get_form_template %}
{% include models.Diagnosis.get_form_template %}
{% multisave models.Treatment %}
```

Alternatively you may want to create your own multisave step forms, you can use the multi-save-wrapper for this.

```html

<div save-multiple-wrapper="editing.treatment">
  <div ng-repeat="editing in model.subrecords">
    {% input field="Treatment.drug" %}
    <button ng-click="remove($index)"></button>
  </div>

  <button ng-click="addAnother()"></button>
</div>
```

#### Complex steps with custom javascript logic
We can pass in custom controllers to individual steps. Custom
controllers are sandboxed, they share scope.editing with other scopes but nothing else. They come prefilled with the defaults that you need. They are passed scope, step and episode.

The scope is the already preloaded with metadata and all the lookup lists so you that's already done for you.

scope.editing is also populated. The Multistage loader at present
looks to see if we've got a single subrecord, if so this then
scope.editing.subRecordApiName is the object. If its 1 or more
subrecords then scope.editing.subRecordApiName is an array of subrecords. Otherwise if there are no subrecords, its given
an empty object.


for example to make a service available in the template for a step, and only in that step

```js
angular.module('opal.controllers').controller('AddResultsCtrl',
function(scope, step, episode, someService) {
    "use strict";

    scope.someService = someService
});
```

`scope.editing is shared between all the steps` and its what is sent back to the server at the end.

If you want to change any data before its sent back to the server you add a function called `preSave` on the scope. This is passed scope.editing.


#### How do I do custom validation for a step/pathway?

If you want to add custom validation, there is an `valid(form)` method that is passed in the form. This you can set validation rules on the form. An invalid form will have the save button
disabled.

#### Custom methods for certain types of pathway

Wizard pathways look for a `hideFooter` variable that defaults to false. If set to true, this will hide the default next/save button. If you don't want the wizard pathway to be a linear progression, ie you want the user to go to different
steps based on options they chose. This is a handy option for you.


### Success redirects

Often, after successfully saving a pathway, we want to redirect the user to a different
url - we do this by overriding the `redirect_url` method on the pathway. For example -
to create a pathway that always logged the user out after a successful save:

```python
class LogoutPathway(pathways.Pathway):
    display_name = 'Logout-O-Matic'
    steps        = (...)

    def redirect_url(self, patient):
        return '/accounts/logout/'
```

#### Redirect mixins

The pathways plugin provides some helpful mixins for common redirect patterns:

```python
class PatientRedirectPathway(pathways.RedirectsToPatientMixin, pathways.Pathway):
    display_name = 'Redirector example Pathway'
    steps = (...)
```

##### pathways.RedirectsToPatientMixin

Redirect to the patient detail page for this patient.

##### pathways.RedirectsToEpisodeMixin

Redirect to the patient detail page, viewing the last episode for this patient.

## Types of Pathway

The pathways plugin provides four types of pathway out of the box.

### Wizard Pathway

A wizard-style pathway displaying one step at a time, with next and back controls.

### Page Pathway

Displays each step as a separate panel, one after the other, all visible at the same
time.

### Modal Page Pathways and Modal Wizard Pathways

The same as the Wizard and Page pathways but for use in modals.

To open a modal pathway in a template use can use the open-pathway directive, e.g.

```html
<a open-pathway="test_results">open test results pathway</a>
```

# Reference

## pathways.Pathway

The base pathway class.

### Pathway.Pathway. _attributes_

#### Pathway.display_name

The human readable display name for this pathway. Will be used in the base template for
full page pathways.

#### Pathway.slug

The slug to use in the URL for accessing an individual pathway, and the string that can
be passed to `Pathway.get()` that will return i.t

#### Pathway.steps

The steps that make up this pathway. A tuple of either `opal.models.Subrecord` or
`pathway.pathways.Step` subclasses.

### Pathway. _methods_

#### Pathway.redirect_url(self, patient)

Returns a string that we should redirect to on success. Defaults to `None`.

## pathways.RedirectsToPatientMixin

Redirect to the patient detail page for this patient.

## pathways.RedirectsToEpisodeMixin

Redirect to the patient detail page, viewing the last episode for this patient.

### Utilities

#### pathways.pathways.delete_others

deletes models that have not been pushed through in the data dictionary, useful
for when we're saving back all of an episode subrecords after a user has
deleted some.


### Road Map

Early versions of Pathways leant heavily on the concept of wizard-style forms with multiple steps.
After testing this with real users however we find that they frequently prefer long forms.

The next iteration for pathways therefore...

* Must build on the UnrolledPathway to make it easier to enter new steps
* Must use the Item api and take advantage of the form controller argument so we can have the same forms accross the board
