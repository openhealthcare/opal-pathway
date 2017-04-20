# Pathways

The Opal Pathways plugin provides developers with a highly extensible method of
working with complex forms in [Opal](https://github.com/openhealthcare/opal).
Typically pathways are forms that allow the user to enter information that spans multiple
`Subrecords` - which can be challenging with the `Subrecord forms` provided by
Opal itself.

`Pathways` provides Wizards, long multi-model forms, custom validation and much more,
all usable either in full page or modal contexts.

This plugin is **Alpha** software.

Although it aldeady provides significant and useful functionality, it is in active development,
and delvelopers should anticipate backwards-incompatible API changes as part of minor
(x.VERSION.x) releases.

[![Build
Status](https://travis-ci.org/openhealthcare/opal-pathway.png?branch=v0.4)](https://travis-ci.org/openhealthcare/opal-pathway)
[![Coverage Status](https://coveralls.io/repos/github/openhealthcare/opal-pathway/badge.svg?branch=v0.4)](https://coveralls.io/github/openhealthcare/opal-pathway)

## Contents

* [Introduction: What is a Pathway?](#introduction-what-is-a-pathway)
* [Installation](#installation)
* [Quickstart Guide](#quickstart-guide)
* [Detailed Topic Guides](#detailed-topic-guides)
* [Reference Guides](#reference)
* [Road Map](#road-map)
* [Modal Pathways](#modal-pathways)

## Introduction: What Is A Pathway?

A pathway is a complex form that we can use in an Opal application. Pathways are comprised of a
collection of `Steps`.

`Pathway Steps` are individual sections of that complex form which provide hooks to
customise validation, presentation or behaviour in a granular manner.

The Pathways plugin ships with two types of pathway, which can be used either on their
own page, or in an Opal modal:

* Wizard style - e.g. the user has to click next to reveal each subsequent step
* Single Page - e.g. displaying all the `Pathway Steps` from the start and the user scrolls to the next one

## Installation

Clone `git@github.com:openhealthcare/opal-pathway`

Run `python setup.py develop`

Add `pathway` to `INSTALLED_APPS` in your `settings.py`.

## Quickstart Guide

In this section we walk you through creating a simple Pathway.

### A First Pathway

Pathways are an Opal
[Discoverable feature](http://opal.openhealthcare.org.uk/docs/guides/discoverable/) -
this means that Opal will automatically load any Pathways defined in a python module
named `pathways.py` inside a Django App.

Individual pathways are defined by subclassing a `Pathway` class. You must set at least the
display name, and will
often want to also set a slug.

Out of the box, pathways ships with two types of pathways. A page pathway, a whole bunch of
model forms on the same page, and a wizard pathway, a bunch of steps where the next step is
only revealed after the step before it has been completed.

Let's look at a page pathway definition.

```python
# yourapp/pathways.py
from pathway import pathways

class MyPathway(pathways.PagePathway):
    display_name = 'My Awesome Pathway'
    slug         = 'awesomest-pathway'
```

### Taking Our First Steps

A Pathway should have at least one `Step` - a section within the form.

`Steps` are defined on the pathway class using the `Pathway.steps` tuple.

```python
from pathway import pathways
from myapp import models

class SimplePathway(pathways.PagePathway):
    display_name = 'A simple pathway'
    steps        = (
        pathways.Step(model=models.PastMedicalHistory)
    )
 ```

### Model Steps

A common case is for steps to be simply a single Opal `Subrecord` using the subrecord form template.

In fact we can simply add Opal `Subrecords` to the `steps` tuple to achieve the same effect.

For instance, to create a pathway with three steps to record a
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

Pathways is smart enough to provide a single form step pathway if the model is a model or a pathway that allows a user to edit/add/remove multiple models if its not.


### Viewing The Pathway

This pathway is then available from e.g. `http://localhost:8000/pathway/#/simples/`.


## Detailed Topic Guides

In this section we cover Pathway concepts in more detail.

* [Loading data from Existing Episodes](#loading-data-from-existing-episodes)
* [Customising server side logic](#customising-the-server-side-logic)
* [Multiple instances of records](#multiple-instances-of-records)
* [Validation](#validation)
* [Wizards](#wizards)
* [Complex steps](#complex-steps)
* [Success Redirects](#success-redirects)

### Loading Data From Existing Episodes

A pathway will load the data for a specific episode if the patient and episode ID are passed in the URL.

For example: `http://localhost:8000/pathway/#/simples/{{ patient_id }}/{{ episode_id }}`

### Customising The Server-side Logic

If you want to add any custom save logic for your step, you can put in a `pre_save` method. This is passed the full data dictionary that has been received from the client and the patient and episode that the pathways been saved for, if they exist (If you're saving a pathway for a new patient/episode, they won't have been created at this time).

*TODO: What is the default for Model Steps ?*

*TODO: How does the data work ? Is the expectation that I alter the data or save a subrecord?*

*TODO: What if I need the new episode/Patient?*

*TODO: Is there a post-save ?*

*TODO: What if I want to do validation on the server ?*

### Multiple Instances Of Records

If the model is not a singleton, by default it will be show in the form as
a multiple section that allows the user to add one or more models.

This displays to the user a delete button, but by default subrecords are *not*
deleted if they press this. You can change them to be deleted by adding the
delete_others argument


```python
from pathway import pathways
from myapp import models

class SimplePathway(pathways.Pathway):
    display_name = 'A simple pathway'
    slug         = 'simples'
    steps        = (
        pathways.MultiSaveStep(model=models.Allergies, delete_others=True),
        models.Treatment,
        models.PastMedicalHistory
    )
```

In this case, the pathway will delete any existing instances of the given Subrecord Model that
are not sent back to the API in the JSON data.

### Complex Steps

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
            display_name='Demographics and Diagnosis',
            icon='fa fa-clock',
            template='pathways/demographics_and_diagnosis_step.html'
            ),
    )
```

The display name and icon are rendered in the header for this step in your pathway, which
exist outside the scope of the step template itself. Then all we would need is the template
itself:

```html
<!-- pathways/demographics_and_diagnosis_step.html -->
{% include models.Demographics.get_form_template %}
{% include models.Diagnosis.get_form_template %}
```

Note pathways created in this way will not add in the model defaults.


#### Complex Steps With Multiple Instances Per Subrecord

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

#### Complex Steps With Custom Javascript Logic

We can pass in custom controllers to individual steps. Custom
controllers are sandboxed, they share scope.editing with other scopes but nothing else. They come prefilled with the defaults that you need. They are passed scope, step and episode.

The scope is the already preloaded with metadata and all the lookup lists so you that's already done for you.

scope.editing is also populated. If the subrecord is a singleton (ie with _is_singleton=True), its populated as an object. Otherwise it comes through to the custom controller and scope as an array of subrecords which is empty if there isn't one.

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


### Validation

If you want to add custom validation, there is an `valid(form)` method that is passed in the form. This means you can set validation rules on the form. An invalid form will have the save button disabled.

*TODO - Server side validation?*

*TODO - Error messages - how do I set them?*

### Wizards

Wizard pathways look for a `hideFooter` variable that defaults to false. If set to true, this will hide the default next/save button. If you don't want the wizard pathway to be a linear progression, ie you want the user to go to different
steps based on options they chose. This is a handy option for you.

*TODO - Next step determination ?*

### Success Redirects

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

#### Redirect Mixins

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

## Modal Pathways

Pathways detect when you're opening a pathway from a modal.

You can use a different template for your modal pathway by adding a modal_template_url attribute to your pathway

Pathways ships with a no footer modal template, the same as the normal modal template but it doesn't display the section at the bottom with the save/cancel button.

To open a modal pathway in a template you can use the open-pathway directive:

```html
<a open-pathway="test_results">open test results pathway</a>
```

The open-pathway directive also includes an optional callback, that is called with the context of the result of the modal.save method, ie episode_id, patient_id and redirect_url.

By default the pathway is opened with whichever episode is on $scope.episode, you can use pathway-episode to define a different episode.

e.g.

```html
<a open-pathway="test_results"  pathway-episode="someOtherEpisode" pathway-callback="refreshEpisode(episode_id)">open test results pathway</a>

```


*TODO Code examples for defining them*

*TODO How do I pass in episode context?*

## Reference

### pathways.Pathway

The base pathway class.

#### Pathway.Pathway. _attributes_

##### Pathway.display_name

The human readable display name for this pathway. Will be used in the base template for
full page pathways.

##### Pathway.slug

The slug to use in the URL for accessing an individual pathway, and the string that can
be passed to `Pathway.get()` that will return i.t

##### Pathway.steps

The steps that make up this pathway. A tuple of either `opal.models.Subrecord` or
`pathway.pathways.Step` subclasses.

###### Patway.pathway_service

The Service that is used to instantiate the pathway. This should inherit from the Pathway js service.


###### Patway.pathway_insert

The name of the class that you're replaceing with the pathway template. You probably shouldn't have to change this.

###### Patway.template
The name of the pathway template, it must include a div/span with the class .to_append which will be replaced by the wrapped step templates.

###### Patway.modal_template

If set, this template will be used if your pathway is opened in a modal. If its not set the template attribute will be used.


#### Pathway. _methods_

##### Pathway.redirect_url(self, patient)

Returns a string that we should redirect to on success. Defaults to `None`.

### pathways.RedirectsToPatientMixin

Redirect to the patient detail page for this patient.

### pathways.RedirectsToEpisodeMixin

Redirect to the patient detail page, viewing the last episode for this patient.

#### Utilities

##### pathways.pathways.delete_others

deletes models that have not been pushed through in the data dictionary, useful
for when we're saving back all of an episode subrecords after a user has
deleted some.


### Documentation Todo

*Theming and templating Guide*

*Full reference documentation*

*Screenshots of default skin*

## Road Map

Early versions of Pathways leant heavily on the concept of wizard-style forms with multiple steps.
After testing this with real users however we find that they frequently prefer long forms.

The next iteration for pathways therefore...

* Must build on the UnrolledPathway to make it easier to enter new steps
* Must use the Item api and take advantage of the form controller argument so we can have the same forms accross the board
