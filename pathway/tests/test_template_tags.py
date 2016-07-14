from opal.core.test import OpalTestCase
from opal.tests.models import Colour
from django.template import Template, Context


class MultSaveTest(OpalTestCase):
    def test_with_model(self):
        template = Template('{% load pathways %}{% multisave models.Colour %}')
        models = dict(models=dict(Colour=Colour))
        rendered = template.render(Context(models))
        self.assertIn('save-multiple="editing.colour"', rendered)
        self.assertIn(
            'save-multiple-form-url="/templates/forms/colour.html"', rendered
        )
        self.assertIn(
            'save-multiple-label="Colour"', rendered
        )
