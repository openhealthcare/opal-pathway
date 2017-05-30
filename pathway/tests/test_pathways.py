import mock
import json
import datetime

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from opal.core import exceptions
from opal.core.test import OpalTestCase
from opal.core.views import OpalSerializer
from opal.models import Demographics, Patient, Episode
from opal.tests.models import (
    DogOwner, Colour, PatientColour, FamousLastWords
)
from pathway.tests.pathways import PagePathwayExample

from pathway.steps import Step, MultiModelStep, delete_others

from pathway import pathways
from pathway.pathways import (
    Pathway, WizardPathway
)


class PathwayExample(Pathway):
    display_name = "Dog Owner"
    slug = 'dog_owner'
    icon = "fa fa-something"
    template_url = "/somewhere"

    steps = (
        Demographics,
        Step(model=DogOwner),
    )

class ColourPathway(Pathway):
    display_name = "colour"
    icon = "fa fa-something"
    template_url = "/somewhere"

    steps = (
        FamousLastWords,
    )


class RedirectsToPatientMixinTestCase(OpalTestCase):

    def test_redirect(self):
        p, e = self.new_patient_and_episode_please()
        url = pathways.RedirectsToPatientMixin().redirect_url(p)
        self.assertEqual('/#/patient/1', url)


class RedirectsToEpisodeMixinTestCase(OpalTestCase):

    def test_redirect(self):
        p, e = self.new_patient_and_episode_please()
        url = pathways.RedirectsToEpisodeMixin().redirect_url(p)
        self.assertEqual('/#/patient/1/1', url)


class PathwayTestCase(OpalTestCase):
    def setUp(self):
        self.assertTrue(
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        )
        super(PathwayTestCase, self).setUp()


class DeleteOthersTestCase(OpalTestCase):
    def setUp(self):
        super(DeleteOthersTestCase, self).setUp()
        self.patient, self.episode = self.new_patient_and_episode_please()
        self.other_patient, self.other_episode = self.new_patient_and_episode_please()
        self.existing_colour = Colour.objects.create(
            episode=self.episode, name="red"
        )
        self.other_colour = Colour.objects.create(
            episode=self.other_episode, name="blue"
        )
        self.patient_colour = PatientColour.objects.create(patient=self.patient)

    def test_delete_episode_subrecord(self):
        data = {
            "colour": []
        }
        delete_others(data, Colour, patient=self.patient, episode=self.episode)
        self.assertEqual(self.episode.colour_set.count(), 0)
        self.assertEqual(Colour.objects.get().id, self.other_colour.id)

    def test_dont_delete_episode_subrecord(self):
        data = {
            "colour": [
                dict(name="red", id=self.existing_colour.id),
            ]
        }
        delete_others(data, Colour, patient=self.patient, episode=self.episode)
        only_colour = self.episode.colour_set.get()
        self.assertEqual(only_colour.id, self.existing_colour.id)
        other = Colour.objects.exclude(id=self.existing_colour.id).get()
        self.assertEqual(other.id, self.other_colour.id)

    def test_delete_singleton(self):
        data = {
            "famous_last_words": []
        }
        with self.assertRaises(exceptions.APIError):
            delete_others(
                data,
                FamousLastWords,
                patient=self.patient,
                episode=self.episode
            )

    def test_delete_patient_subrecord(self):
        data = {
            "patient_colour": []
        }
        delete_others(
            data, PatientColour, patient=self.patient, episode=self.episode
        )

    def test_delete_non_subrecord(self):
        data = {
            "user": []
        }
        with self.assertRaises(exceptions.APIError):
            delete_others(
                data, User, patient=self.patient, episode=self.episode
            )


class MultiModelSaveTestCase(OpalTestCase):
    def setUp(self):
        super(MultiModelSaveTestCase, self).setUp()
        self.patient, self.episode = self.new_patient_and_episode_please()
        self.existing_colour = Colour.objects.create(
            episode=self.episode, name="red"
        )

    def test_init_raises(self):
        with self.assertRaises(exceptions.APIError):
            MultiModelStep()

    def test_pre_save_no_delete(self):
        multi_save = MultiModelStep(model=Colour, delete_others=False)
        multi_save.pre_save(
            {'colour': []}, Colour, patient=self.patient, episode=self.episode
        )
        self.assertEqual(Colour.objects.get().id, self.existing_colour.id)

    def test_pre_save_with_delete(self):
        multi_save = MultiModelStep(model=Colour)
        multi_save.pre_save(
            {'colour': []}, Colour, patient=self.patient, episode=self.episode
        )
        self.assertEqual(Colour.objects.count(), 0)


class TestSavePathway(PathwayTestCase):

    def setUp(self):
        self.url = reverse(
            "pathway", kwargs=dict(name="dog_owner")
        )
        super(TestSavePathway, self).setUp()

    def get_field_dict():
        return dict(
            demographics=[
                dict(
                    hospital_number="1231232",
                )
            ],
            dog_owner=[
                dict(
                    name="Susan",
                    dog="poodle"
                ),
                dict(
                    name="Joan",
                    dog="Indiana"
                )
            ]
        )

    def post_data(self, field_dict=None, url=None):
        url = url or self.url
        if field_dict is None:
            field_dict = dict(
                demographics=[
                    dict(
                        hospital_number="1231232",
                    )
                ],
                dog_owner=[
                    dict(
                        name="Susan",
                        dog="poodle"
                    ),
                    dict(
                        name="Joan",
                        dog="Indiana"
                    )
                ]
            )
        result = self.post_json(url, field_dict)
        self.assertEqual(result.status_code, 200)

    def test_new_patient_save(self):
        self.assertFalse(Patient.objects.exists())
        self.assertFalse(DogOwner.objects.exists())
        self.post_data()

        patient = Patient.objects.get(
            demographics__hospital_number="1231232"
        )

        episode = patient.episode_set.get()

        self.assertEqual(DogOwner.objects.count(), 2)

        susan = DogOwner.objects.get(name="Susan")
        self.assertEqual(susan.dog, "poodle")
        self.assertEqual(susan.episode, episode)

        joan = DogOwner.objects.get(name="Joan")
        self.assertEqual(joan.dog, "Indiana")
        self.assertEqual(joan.episode, episode)

    def test_existing_patient_new_episode_save(self):
        patient, episode = self.new_patient_and_episode_please()
        demographics = patient.demographics_set.get()
        demographics.hospital_number = "1231232"
        demographics.save()

        url = reverse(
            "pathway", kwargs=dict(
                name="dog_owner",
                patient_id=1
            )
        )
        self.post_data(url=url)
        self.assertEqual(patient.episode_set.count(), 2)
        self.assertEqual(DogOwner.objects.filter(episode_id=2).count(), 2)
        self.assertFalse(DogOwner.objects.filter(episode_id=episode.id).exists())

    def test_users_patient_passed_in(self):
        pathway = PagePathwayExample()
        patient, episode = self.new_patient_and_episode_please()
        post_data = {"demographics": [{"hospital_number": "101"}]}
        pathway.save(data=post_data, user=self.user, patient=patient)
        demographics = patient.demographics_set.get()
        self.assertEqual(
            demographics.hospital_number,
            "101"
        )

    def test_users_episode_passed_in(self):
        pathway = PagePathwayExample()
        patient, episode = self.new_patient_and_episode_please()
        post_data = {"dog_owner": [{"name": "fido"}]}
        pathway.save(
            data=post_data, user=self.user, patient=patient, episode=episode
        )
        self.assertEqual(
            episode.dogowner_set.get().name,
            "fido"
        )

    def test_override_patient(self):
        patient_1, episode_1 = self.new_patient_and_episode_please()
        patient_2, episode_2 = self.new_patient_and_episode_please()
        pathway = PagePathwayExample(
            patient_id=patient_1.id, episode_id=episode_1.id
        )
        post_data = {"demographics": [{"hospital_number": "101"}]}
        pathway.save(data=post_data, user=self.user, patient=patient_2)
        demographics = patient_2.demographics_set.get()
        self.assertEqual(
            demographics.hospital_number,
            "101"
        )

    def test_override_episode(self):
        patient_1, episode_1 = self.new_patient_and_episode_please()
        patient_2, episode_2 = self.new_patient_and_episode_please()
        pathway = PagePathwayExample(
            patient_id=patient_1.id, episode_id=episode_1.id
        )
        post_data = {"dog_owner": [{"name": "fido"}]}
        pathway.save(
            data=post_data,
            user=self.user,
            patient=patient_2,
            episode=episode_2
        )
        self.assertEqual(
            episode_2.dogowner_set.get().name,
            "fido"
        )

    def test_existing_patient_existing_episode_save(self):
        patient, episode = self.new_patient_and_episode_please()
        demographics = patient.demographics_set.get()
        demographics.hospital_number = "1231232"
        demographics.save()
        url = reverse(
            "pathway", kwargs=dict(
                name="dog_owner",
                episode_id=1,
                patient_id=1
            )
        )
        self.post_data(url=url)
        patient = Patient.objects.get(
            demographics__hospital_number="1231232"
        )

        episode = patient.episode_set.get()

        self.assertEqual(DogOwner.objects.count(), 2)

        susan = DogOwner.objects.get(name="Susan")
        self.assertEqual(susan.dog, "poodle")
        self.assertEqual(susan.episode, episode)

        joan = DogOwner.objects.get(name="Joan")
        self.assertEqual(joan.dog, "Indiana")
        self.assertEqual(joan.episode, episode)


@mock.patch("pathway.pathways.subrecords.subrecords")
class TestRemoveUnChangedSubrecords(OpalTestCase):
    def setUp(self):
        self.patient, self.episode = self.new_patient_and_episode_please()
        self.pathway_example = ColourPathway(
            patient_id=self.patient.id,
            episode_id=self.episode.id
        )

    def test_dont_update_subrecords_that_havent_changed(self, subrecords):
        subrecords.return_value = [Colour]
        colour = Colour.objects.create(
            consistency_token="unchanged",
            name="Red",
            episode=self.episode,
            created=datetime.datetime.now()
        )
        provided_dict = colour.to_dict(self.user)
        provided_dict = json.loads(json.dumps(provided_dict, cls=OpalSerializer))
        provided_dict.pop("episode_id")

        result = self.pathway_example.remove_unchanged_subrecords(
            self.episode,
            dict(colour=[provided_dict]),
            self.user
        )
        self.assertEqual(len(result), 0)

    def test_save_new_subrecords(self, subrecords):
        subrecords.return_value = [Colour]

        result = self.pathway_example.remove_unchanged_subrecords(
            self.episode,
            dict(colour=[dict(name="Blue")]),
            self.user
        )
        self.assertEqual(result["colour"][0]["name"], "Blue")

    def test_update_changed_subrecords(self, subrecords):
        subrecords.return_value = [Colour]
        colour = Colour.objects.create(
            consistency_token="unchanged",
            name="Blue",
            episode=self.episode,
        )
        colour_dict = colour.to_dict(self.user)
        colour_dict["name"] = "Red"
        colour_dict.pop("episode_id")

        result = self.pathway_example.remove_unchanged_subrecords(
            self.episode,
            dict(colour=[colour_dict]),
            self.user
        )

        self.assertEqual(
            len(result["colour"]), 1
        )

        self.assertEqual(
            result["colour"][0]["name"], "Red"
        )

    def test_only_change_one_in_a_list(self, subrecords):
        subrecords.return_value = [Colour]
        colour_1 = Colour.objects.create(
            consistency_token="unchanged",
            name="Blue",
            episode=self.episode,
        )
        colour_2 = Colour.objects.create(
            consistency_token="unchanged",
            name="Orange",
            episode=self.episode,
        )
        colour_dict_1 = colour_1.to_dict(self.user)
        colour_dict_1["name"] = "Red"
        colour_dict_1.pop("episode_id")

        colour_dict_2 = colour_2.to_dict(self.user)
        colour_dict_2.pop("episode_id")

        result = self.pathway_example.remove_unchanged_subrecords(
            self.episode,
            dict(colour=[colour_dict_1, colour_dict_2]),
            self.user
        )
        self.assertEqual(len(result["colour"]), 1)

        # only colour 1 has changed
        self.assertEqual(result["colour"][0]["id"], colour_1.id)

    def test_integration(self, subrecords):
        subrecords.return_value = [Colour]

        colour_1 = Colour(episode=self.episode)
        colour_1.update_from_dict(
            {
                "name": "blue",
            },
            self.user
        )
        consistency_token_1 = colour_1.consistency_token
        colour_2 = Colour(episode=self.episode)
        colour_2.update_from_dict(
            {
                "name": "orange",
            },
            self.user
        )
        consistency_token_2 = colour_2.consistency_token

        colour_dict_1 = colour_1.to_dict(self.user)
        colour_dict_1["name"] = "Red"
        colour_dict_1.pop("episode_id")
        colour_dict_2 = colour_2.to_dict(self.user)
        colour_dict_2.pop("episode_id")
        provided_dict = dict(
            colour=[colour_dict_1, colour_dict_2]
        )
        dumped = json.loads(json.dumps(provided_dict, cls=OpalSerializer))

        self.pathway_example.save(dumped, self.user)

        saved_colour_1 = self.episode.colour_set.get(id=colour_1.id)
        self.assertNotEqual(
            saved_colour_1.consistency_token, consistency_token_1
        )

        saved_colour_2 = self.episode.colour_set.get(id=colour_2.id)
        self.assertEqual(
            saved_colour_2.consistency_token, consistency_token_2
        )


class TestPathwayMethods(OpalTestCase):

    def test_slug(self):
        self.assertEqual('colourpathway', ColourPathway().slug)

    def test_vanilla_to_dict(self):
        as_dict = PathwayExample().to_dict(is_modal=False)
        self.assertEqual(len(as_dict["steps"]), 2)
        self.assertEqual(as_dict["display_name"], "Dog Owner")
        self.assertEqual(as_dict["icon"], "fa fa-something")
        self.assertEqual(as_dict["save_url"], reverse(
            "pathway", kwargs=dict(name="dog_owner")
        ))
        self.assertEqual(as_dict["pathway_service"], "Pathway")
        self.assertEqual(as_dict["finish_button_text"], "Save")
        self.assertEqual(as_dict["finish_button_icon"], "fa fa-save")

    @mock.patch('pathway.pathways.Pathway.get_pathway_service')
    def test_get_pathway_service(
        self, get_pathway_service
    ):
        get_pathway_service.return_value = "something"
        as_dict = PathwayExample().to_dict(is_modal=True)
        self.assertEqual(as_dict["pathway_service"], "something")
        get_pathway_service.assert_called_once_with(True)

    def test_get_steps(self):
        pathway = PathwayExample()
        steps = pathway.get_steps()
        self.assertEqual(
            steps[0].model, Demographics
        )
        self.assertEqual(
            steps[1].model, DogOwner
        )
        patient, episode = self.new_patient_and_episode_please()
        steps_with_args = pathway.get_steps(patient=patient, episode=episode)
        self.assertEqual(
            [i.model for i in steps],
            [i.model for i in steps_with_args]
        )


class WizardPathwayTestCase(OpalTestCase):
    def setUp(self):
        class SomeWizardPathway(WizardPathway):
            display_name = "Dog Owner"
            slug = 'dog_owner'
            icon = "fa fa-something"
            template_url = "/somewhere"

            steps = (
                Demographics,
                Step(model=DogOwner),
            )
        self.pathway = SomeWizardPathway()
