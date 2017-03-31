from opal.core.test import OpalTestCase
from django.core.urlresolvers import reverse
from mock import patch, MagicMock


@patch("pathway.pathways.Pathway.get")
class PathwaySaveViewTestCase(OpalTestCase):
    def setUp(self):
        self.patient, self.episode = self.new_patient_and_episode_please()
        self.fake_pathway_instance = MagicMock()
        self.fake_pathway = MagicMock(return_value=self.fake_pathway_instance)
        self.fake_pathway_instance.save.return_value = self.patient
        self.fake_pathway_instance.redirect_url.return_value = "/"

    def test_arguments_patient_and_episode_passed_through(
        self, fake_pathway_get
    ):
        fake_pathway_get.return_value = self.fake_pathway
        url = reverse("pathway", kwargs=dict(
            name="fake",
            patient_id=self.patient.id,
            episode_id=self.episode.id
        ))

        self.assertTrue(
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        )

        self.post_json(url, {})
        self.fake_pathway.assert_called_once_with(
            episode_id=str(self.episode.id),
            patient_id=str(self.patient.id)
        )

    def test_arguments_patient_passed_through(
        self, fake_pathway_get
    ):
        fake_pathway_get.return_value = self.fake_pathway
        url = reverse("pathway", kwargs=dict(
            name="fake",
            patient_id=self.patient.id
        ))

        self.assertTrue(
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        )

        self.post_json(url, {})
        self.fake_pathway.assert_called_once_with(
            patient_id=str(self.patient.id),
            episode_id=None,
        )

    def test_no_arguments_passed_through(
        self, fake_pathway_get
    ):
        fake_pathway_get.return_value = self.fake_pathway
        url = reverse("pathway", kwargs=dict(
            name="fake",
        ))

        self.assertTrue(
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        )

        self.post_json(url, {})
        self.fake_pathway.assert_called_once_with(
            patient_id=None,
            episode_id=None,
        )
