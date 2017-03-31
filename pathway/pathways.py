import inspect
import json
from functools import wraps
from collections import defaultdict

from django.core.urlresolvers import reverse
from django.db import models, transaction
from django.utils.text import slugify
from django.utils.functional import cached_property

from opal.core import discoverable, exceptions, subrecords
from opal.models import Patient, Episode, EpisodeSubrecord, PatientSubrecord
from opal.utils import AbstractBase, camelcase_to_underscore
from opal.core.views import OpalSerializer
from steps import SingleModelStep, MultiModelStep, Step


class RedirectsToPatientMixin(object):
    def redirect_url(self, patient):
        return "/#/patient/{0}".format(patient.id)


class RedirectsToEpisodeMixin(object):
    def redirect_url(self, patient):
        episode = patient.episode_set.last()
        return "/#/patient/{0}/{1}".format(patient.id, episode.id)


class Pathway(discoverable.DiscoverableFeature):
    module_name = "pathways"
    pathway_service = "Pathway"
    finish_button_text = "Save"
    finish_button_icon = "fa fa-save"

    # any iterable will do, this should be overridden
    steps = []

    # the class that we append the compiled form onto

    def __init__(self, patient_id=None, episode_id=None):
        self.episode_id = episode_id
        self.patient_id = patient_id

    @cached_property
    def episode(self):
        if self.episode_id is None:
            return None
        return Episode.objects.get(id=self.episode_id)

    @cached_property
    def patient(self):
        if self.patient_id is None:
            return None
        return Patient.objects.get(id=self.patient_id)

    def get_pathway_service(self, is_modal):
        return self.pathway_service

    @property
    def slug(self):
        return slugify(self.__class__.__name__)

    def get_template(self, is_modal):
        if is_modal:
            return self.modal_template
        return self.template

    def save_url(self):
        kwargs = dict(name=self.slug)

        if self.episode_id:
            kwargs["episode_id"] = self.episode_id

        if self.patient_id:
            kwargs["patient_id"] = self.patient_id

        return reverse("pathway", kwargs=kwargs)

    def redirect_url(save, patient):
        return None

    @transaction.atomic
    def save(self, data, user):
        patient = self.patient
        episode = self.episode

        if patient and not episode:
            raise exceptions.APIError(
                "at the moment pathway requires an episode and a pathway"
            )

        for step in self.get_steps():
            step.pre_save(
                data, user, patient=self.patient, episode=self.episode
            )

        if not patient:
            if "demographics" in data:
                hospital_number = data["demographics"][0]["hospital_number"]
                patient_query = Patient.objects.filter(
                    demographics__hospital_number=hospital_number
                )
                patient = patient_query.first()

            if not patient:
                patient = Patient()

        # if there is an episode, remove unchanged subrecords
        if self.patient:
            data = self.remove_unchanged_subrecords(episode, data, user)
        patient.bulk_update(data, user, episode=episode)
        return patient

    def remove_unchanged_subrecords(self, episode, new_data, user):

        # to_dict outputs dates as date() instances, but our incoming data
        # will be settings.DATE_FORMAT date strings. So we dump() then load()
        old_data = json.dumps(episode.to_dict(user), cls=OpalSerializer)
        old_data = json.loads(old_data)

        changed = defaultdict(list)

        for subrecord_class in subrecords.subrecords():
            subrecord_name = subrecord_class.get_api_name()
            old_subrecords = old_data.get(subrecord_name)
            new_subrecords = new_data.get(subrecord_name)

            if not new_subrecords:
                continue

            if not old_subrecords and new_subrecords:
                changed[subrecord_name] = new_subrecords
                continue

            id_to_old_subrecord = {i["id"]: i for i in old_subrecords}

            for new_subrecord in new_subrecords:
                if not new_subrecord.get("id"):
                    changed[subrecord_name].append(new_subrecord)
                else:
                    # schema doesn't translate these ids, so pop them out
                    old_subrecord = id_to_old_subrecord[new_subrecord["id"]]
                    old_subrecord.pop("episode_id", None)
                    old_subrecord.pop("patient_id", None)
                    if not new_subrecord == old_subrecord:
                        changed[subrecord_name].append(new_subrecord)
        return changed

    def get_steps(self):
        all_steps = []
        for step in self.steps:
            if inspect.isclass(step) and issubclass(step, models.Model):
                if step._is_singleton:
                    all_steps.append(SingleModelStep(model=step))
                else:
                    all_steps.append(MultiModelStep(model=step))
            else:
                all_steps.append(step)

        return all_steps

    def to_dict(self, is_modal):
        # the dict we json to send over
        # in theory it takes a list of either models or steps
        # in reality you can swap out steps for anything with a todict method
        # we need to have a template_url, title and an icon, optionally
        # it can take a step_controller with the name of the angular
        # controller

        steps_info = [i.to_dict() for i in self.get_steps()]

        return dict(
            steps=steps_info,
            finish_button_text=self.finish_button_text,
            finish_button_icon=self.finish_button_icon,
            display_name=self.display_name,
            icon=getattr(self, "icon", None),
            save_url=self.save_url(),
            pathway_service=self.get_pathway_service(is_modal),
        )


class WizardPathway(Pathway, AbstractBase):
    pathway_service = "WizardPathway"
    template = "pathway/templates/wizard_pathway.html"
    modal_template = "pathway/templates/modal_wizard_pathway.html"


class PagePathway(Pathway, AbstractBase):
    """
    An unrolled pathway will display all of it's forms
    at once, rather than as a set of steps.
    """
    template = "pathway/templates/page_pathway.html"
    modal_template = "pathway/templates/modal_page_pathway.html"
