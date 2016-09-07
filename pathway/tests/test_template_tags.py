from opal.core.test import OpalTestCase
from opal.tests.models import Colour
from django.template import Template, Context
from mock import patch


class MultSaveTest(OpalTestCase):
    @patch.object(Colour, 'get_form_template')
    def test_defaults(self, get_form_template):
        get_form_template.return_value = "forms/colour.html"
        template = Template('{% load pathways %}{% multisave models.Colour %}')
        models = dict(models=dict(Colour=Colour))
        rendered = template.render(Context(models))
        self.assertIn('save-multiple-wrapper="editing.colour"', rendered)
        self.assertIn(
            'initialiseEmpty="1"', rendered
        )
        self.assertTrue(get_form_template.called)

    @patch.object(Colour, 'get_form_template')
    def test_defaults(self, get_form_template):
        get_form_template.return_value = "forms/colour.html"
        template = Template('{% load pathways %}{% multisave models.Colour initialise_empty=False %}')
        models = dict(models=dict(Colour=Colour))
        rendered = template.render(Context(models))
        self.assertIn(
            'initialiseEmpty="0"', rendered
        )
