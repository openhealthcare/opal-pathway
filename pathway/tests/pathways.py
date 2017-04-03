from pathway import pathways, steps
from opal.tests import models as test_models


class PagePathwayExample(pathways.PagePathway):
    display_name = "Dog Owner"
    slug = 'dog_owner'
    icon = "fa fa-something"

    steps = (
        test_models.Demographics,
        steps.Step(model=test_models.DogOwner),
        test_models.Colour,
    )


class WizardPathwayExample(pathways.WizardPathway):
    display_name = "colour"
    slug = 'colour'
    icon = "fa fa-something"

    steps = (
        test_models.Colour,
    )
