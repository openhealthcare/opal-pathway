OPAL Pathway provides developers with a highly extensible method of
working with complex forms in [OPAL](https://github.com/openhealthcare/opal).
It provides Wizards, long multi-model forms, custom validation and much more,
all usable either in full page or modal contexts.

[![Build
Status](https://travis-ci.org/openhealthcare/opal-pathway.png?branch=v0.2)](https://travis-ci.org/openhealthcare/opal-pathway)
[![Coverage Status](https://coveralls.io/repos/github/openhealthcare/opal-pathway/badge.svg?branch=v0.2)](https://coveralls.io/github/openhealthcare/opal-pathway)


## Defining pathways

Pathways are an OPAL Discoverable feature, so we expect your pathway definitions to be in
a python module named `pathways.py` inside a Django App. Individual pathways are defined
by subclassing the `pathways.Pathway` class. We must set at least the display name, and
often want to also set a slug.

```python
from pathway import pathways

class MyPathway(pathways.Pathway):
    display_name = 'My Awesome Pathway'
    slug         = 'awesomest-pathway'
```

### Pathway steps

A pathway is made up of 1-n `Steps`. These are defined on the pathway class using the
`Pathway.steps` tuple.

In the simplest case, we can simply add OPAL `Subrecords` to this tuple, and the Pathway
will use the default form from `Subrecord.get_form_template`.


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

You could access this pathway from e.g. `http:\\localhost:8000\pathway\#\simples\`.

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
pathways.MultiSaveStep(model=models.Allergies, delete_existing=True)
```

In this case, the pathway will delete any existing instances of the given Subrecord Model that are not sent
back to the API in the JSON data.

### Complex steps - more than one subrecord type

If we want to save multiple types of subrecords at the same step, we can do that by simply including the
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

### Opening a pathway for a particular patient/episode

If you want to open a pathway for a particular episode you can by going adding the patient id and the episode id to the end of the url. For example `http:\\localhost:8000\pathway\#\simples\[[ patient_id ]]\[[ episode_id ]]`.



### Adding custom javascript logic

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

The pathways plugin provides three types of pathway out of the box.

### Pathway

A wizard-style pathway displaying one step at a time, with next and back controls.

### UnrolledPathway

Displays each step as a separate panel, one after the other, all visible at the same
time.

### ModalPathway

A pathway type for use inside OPAL modals.

to open a modal pathway in a template use can use the open-pathway directive, e.g.

<a open-pathway="test_results">open test results pathway</a>

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
