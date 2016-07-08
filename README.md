OPAL Pathway provides developers with a highly extensible method of
working with complex forms in [OPAL](https://github.com/openhealthcare/opal).
It provides Wizards, long multi-model forms, custom validation and much more,
all usable either in full page or modal contexts.

## Installation

Add to your application's requirements:

    -e git+https://github.com/openhealthcare/opal-pathway.git@master#egg=opal_pathway

and install with pip:

    $ pip install -r requirements


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

## Reference

### Pathway.display_name

The human readable display name for this pathway. Will be used in the base template for
full page pathways.

### Pathway.slug

The slug to use in the URL for accessing an individual pathway, and the string that can
be passed to `Pathway.get()` that will return it.

### Pathway.steps

The steps that make up this pathway. A tuple of either `opal.models.Subrecord` or
`pathway.pathways.Step` subclasses.
