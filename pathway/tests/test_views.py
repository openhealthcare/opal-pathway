from opal.core.test import OpalTestCase
from django.core.urlresolvers import reverse
from pathway.tests import pathways as test_pathways


class PathwayViewsTestCase(OpalTestCase):
    def get_response(self, pathway, login=True, is_modal=False):
        url = reverse("pathway_template", kwargs=dict(name=pathway.slug))
        if is_modal:
            url = url + "?is_modal=True"
        if login:
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        return self.client.get(url)

    def test_integration_page_modal(self):
        response = self.get_response(
            test_pathways.PagePathwayExample(), is_modal=True
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("modal-body", response.content)
        self.assertIn('form name="form"', response.content)

    def test_integration_page_non_modal(self):
        response = self.get_response(
            test_pathways.PagePathwayExample(), is_modal=False
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("modal-body", response.content)
        self.assertIn('form name="form"', response.content)

    def test_integration_wizard_modal(self):
        response = self.get_response(
            test_pathways.WizardPathwayExample(), is_modal=True
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("modal-body", response.content)
        self.assertIn('form name="form"', response.content)

    def test_integration_wizard_non_modal(self):
        response = self.get_response(
            test_pathways.WizardPathwayExample(), is_modal=False
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("modal-body", response.content)
        self.assertIn('form name="form"', response.content)

    def test_login_required(self):
        response = self.get_response(
            test_pathways.WizardPathwayExample(), login=False
        )
        self.assertEqual(response.status_code, 302)
