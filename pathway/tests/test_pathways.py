import mock
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from opal.core.test import OpalTestCase
from opal.core import exceptions
from opal.models import Demographics, Patient, Episode
from opal.tests.models import DogOwner, Colour, PatientColour, FamousLastWords
from pathway.pathways import Pathway, Step, MultiSaveStep, delete_others


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
    slug = 'colour'
    icon = "fa fa-something"
    template_url = "/somewhere"

    steps = (
        Colour,
    )

class PathwayTestCase(OpalTestCase):
    def setUp(self):
        self.assertTrue(
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        )
        super(PathwayTestCase, self).setUp()


class TestPathwayGet(PathwayTestCase):

    def test_vanilla_get(self):
        self.assertStatusCode('/pathway/', 200)


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


class MultiSaveTestCase(OpalTestCase):
    def setUp(self):
        super(MultiSaveTestCase, self).setUp()
        self.patient, self.episode = self.new_patient_and_episode_please()
        self.existing_colour = Colour.objects.create(
            episode=self.episode, name="red"
        )

    def test_init_raises(self):
        with self.assertRaises(exceptions.APIError):
            MultiSaveStep()

    def test_pre_save_no_delete(self):
        multi_save = MultiSaveStep(model=Colour)
        multi_save.pre_save(
            {'colour': []}, Colour, patient=self.patient, episode=self.episode
        )
        self.assertEqual(Colour.objects.get().id, self.existing_colour.id)

    def test_pre_save_with_delete(self):
        multi_save = MultiSaveStep(model=Colour, delete_others=True)
        multi_save.pre_save(
            {'colour': []}, Colour, patient=self.patient, episode=self.episode
        )
        self.assertEqual(Colour.objects.count(), 0)


class TestSavePathway(PathwayTestCase):
    url = "/pathway/dog_owner/save"

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

    def post_data(self, field_dict=None):
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
        result = self.post_json(self.url, field_dict)
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

        self.post_data()
        patient = Patient.objects.get(
            demographics__hospital_number="1231232"
        )

        episode = patient.episode_set.last()

        self.assertEqual(DogOwner.objects.count(), 2)

        susan = DogOwner.objects.get(name="Susan")
        self.assertEqual(susan.dog, "poodle")
        self.assertEqual(susan.episode, episode)

        joan = DogOwner.objects.get(name="Joan")
        self.assertEqual(joan.dog, "Indiana")
        self.assertEqual(joan.episode, episode)


    def test_existing_patient_existing_episode_save(self):
        patient, episode = self.new_patient_and_episode_please()
        demographics = patient.demographics_set.get()
        demographics.hospital_number = "1231232"
        demographics.save()

        field_dict = dict(
            demographics=[
                dict(
                    hospital_number="1231232",
                )
            ],
            dog_owner=[
                dict(
                    name="Susan",
                    dog="poodle",
                    episode_id=episode.id,
                ),
                dict(
                    name="Joan",
                    dog="Indiana",
                    episode_id=episode.id,
                )
            ]
        )
        url = "/pathway/dog_owner/save/{0}/{1}".format(patient.id, episode.id)
        self.post_json(url, field_dict)
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
            name="Blue",
            episode=self.episode
        )
        provided_dict = colour.to_dict(self.user)

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
            episode=self.episode
        )
        colour_dict = colour.to_dict(self.user)
        colour_dict["name"] = "Red"

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
            episode=self.episode
        )
        colour_2 = Colour.objects.create(
            consistency_token="unchanged",
            name="Orange",
            episode=self.episode
        )
        colour_dict_1 = colour_1.to_dict(self.user)
        colour_dict_1["name"] = "Red"
        colour_dict_2 = colour_1.to_dict(self.user)

        result = self.pathway_example.remove_unchanged_subrecords(
            self.episode,
            dict(colour=[colour_dict_1, colour_dict_2]),
            self.user
        )
        self.assertEqual(len(result["colour"]), 1)

        # only colour 1 has changed
        self.assertEqual(result["colour"][0]["id"], colour_1.id)

    def integration_test(self, subrecrods):
        subrecords.return_value = [Colour]
        colour_1 = Colour.objects.create(
            consistency_token="changed",
            name="Blue",
            episode=self.episode
        )
        colour_2 = Colour.objects.create(
            consistency_token="unchanged",
            name="Orange",
            episode=self.episode
        )
        colour_dict_1 = colour_1.to_dict(self.user)
        colour_dict_1["name"] = "Red"
        colour_dict_2 = colour_1.to_dict(self.user)
        provided_dict=dict(
            colour=[colour_dict_1, colour_dict_2]
        )
        self.pathway.save(provided_dict, self.user)
        re_colour_1 = self.episode.colour_set.get(id=colour_1.id)
        self.assertEqual(re_colour_1.name, "Red")
        self.assertEqual(colour_name_1, "Red")
        self.assertNotEqual(
            re_colour_1.consistency_token,
            "changed"
        )

        re_colour_2 = self.episode.colour_set.get(id=colour_2.id)
        self.assertEqual(re_colour_2.name, "Orange")
        self.assertEqual(
            re_colour_2.consistency_token,
            "unchanged"
        )


class TestPathwayToDict(OpalTestCase):
    def test_vanilla_to_dict(self):
        as_dict = PathwayExample().to_dict()
        self.assertEqual(len(as_dict["steps"]), 2)
        self.assertEqual(as_dict["display_name"], "Dog Owner")
        self.assertEqual(as_dict["icon"], "fa fa-something")
        self.assertEqual(as_dict["save_url"], reverse(
            "pathway_create", kwargs=dict(name="dog_owner")
        ))
        self.assertEqual(as_dict["pathway_insert"], ".pathwayInsert")
        self.assertEqual(as_dict["template_url"], "/somewhere")
        self.assertEqual(as_dict["pathway_service"], "Pathway")
