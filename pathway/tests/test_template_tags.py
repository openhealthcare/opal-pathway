from opal.core.test import OpalTestCase
from opal.tests.models import Colour
from django.template import Template, Context
from mock import patch


class MultSaveTest(OpalTestCase):
    @patch.object(Colour, 'get_form_url')
    def test_with_model(self, get_form_url):
        get_form_url.return_value = "/templates/forms/colour.html"
        template = Template('{% load pathways %}{% multisave models.Colour %}')
        models = dict(models=dict(Colour=Colour))
        rendered = template.render(Context(models))
        self.assertIn('save-multiple="editing.colour"', rendered)
        self.assertIn(
            'save-multiple-form-url="\'/templates/forms/colour.html\'"', rendered
        )
        self.assertIn(
            'save-multiple-label="\'Colour\'"', rendered
        )
