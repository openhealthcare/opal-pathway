from opal.core.test import OpalTestCase
from opal.models import Demographics, Patient, Episode
from opal.tests.models import DogOwner
from pathway.pathways import Pathway, DemographicsStep, Step


class PathwayExample(Pathway):
    title = "Dog Owner"
    slug = 'dog_owner'

    steps = (
        DemographicsStep(model=Demographics),
        Step(model=DogOwner),
    )


class PathwayTestCase(OpalTestCase):
    def setUp(self):
        self.assertTrue(
            self.client.login(
                username=self.user.username, password=self.PASSWORD
            )
        )


class TestPathwayGet(PathwayTestCase):

    def test_vanilla_get(self):
        self.assertStatusCode('/pathway/', 200)

class TestSavePathway(PathwayTestCase):
    url = "/pathway/dog_owner/save/"

    def post_data(self):
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
        self.post_json(self.url, field_dict)


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
        patient = Patient.objects.create()
        episode = Episode.objects.create(patient=patient)
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
        patient = Patient.objects.create()
        episode = Episode.objects.create(patient=patient)
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
        url = "/pathway/dog_owner/save/{}".format(episode.id)
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
