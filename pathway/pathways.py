import inspect
import json
from functools import wraps
from collections import defaultdict

from django.core.urlresolvers import reverse
from django.db import models, transaction
from django.utils.text import slugify

from opal.core import discoverable, exceptions, subrecords
from opal.models import Patient, Episode, EpisodeSubrecord, PatientSubrecord
from opal.utils import AbstractBase
from opal.core.views import OpalSerializer


def extract_pathway_field(some_fun):
    """ if a field isn't in the keywords, pull it off the model,
        if there isn't a model and its in the keywords then raise
        an exception
    """
    @wraps(some_fun)
    def func_wrapper(self):
        if some_fun.__name__ in self.other_args:
            return self.other_args[some_fun.__name__]
        else:
            if not self.model:
                NotImplementedError(
                    "%s needs to either be a keyword or we need a model set"
                )
            return some_fun(self)
    return func_wrapper


def delete_others(data, model, patient=None, episode=None):
    """
        deletes all subrecords that are not in data
    """
    if issubclass(model, EpisodeSubrecord):
        existing = model.objects.filter(episode=episode)
    elif issubclass(model, PatientSubrecord):
        existing = model.objects.filter(patient=patient)
    else:
        err = "delete others called with {} requires a subrecord"
        raise exceptions.APIError(err.format(model.__name__))

    if model._is_singleton:
        err = "you can't mass delete a singleton for {}"
        raise exceptions.APIError(err.format(model.__name__))

    existing_data = data.get(model.get_api_name(), [])
    ids = [i["id"] for i in existing_data if "id" in i]
    existing = existing.exclude(id__in=ids)

    for i in existing:
        i.delete()


class Step(object):
    def __init__(self, model=None, **kwargs):
        self.model = model
        self.other_args = kwargs

    @extract_pathway_field
    def template_url(self):
        return self.model.get_form_url()

    @extract_pathway_field
    def get_display_name(self):
        return self.model.get_display_name()

    @extract_pathway_field
    def icon(self):
        return getattr(self.model, "_icon", None)

    @extract_pathway_field
    def api_name(self):
        return self.model.get_api_name()

    @extract_pathway_field
    def step_controller(self):
        return "DefaultStep"

    def to_dict(self):
        # this needs to handle singletons and whether we should update
        result = dict(step_controller=self.step_controller())

        if self.model:
            result.update(dict(
                template_url=self.template_url(),
                display_name=self.get_display_name(),
                icon=self.icon(),
                api_name=self.api_name(),
            ))

        result.update(self.other_args)
        return result

    def pre_save(self, data, user, patient=None, episode=None):
        pass


class MultiSaveStep(Step):
    def __init__(self, *args, **kwargs):
        if "model" not in kwargs:
            raise exceptions.APIError(
                "Mulitsave requires a model to be passed in"
            )
        self.delete_others = kwargs.pop("delete_others", False)
        super(MultiSaveStep, self).__init__(*args, **kwargs)

    def template_url(self):
        return "/templates/pathway/multi_save.html"

    def pre_save(self, data, user, patient=None, episode=None):
        if self.delete_others:
            delete_others(data, self.model, patient=patient, episode=episode)
        super(MultiSaveStep, self).pre_save( data, user, patient, episode)


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
    step_wrapper_template_url = "/templates/pathway/step_wrappers/default.html"
    pathway_insert = ".pathwayInsert"
    finish_button_text = "Save"
    finish_button_icon = "fa fa-save"

    # any iterable will do, this should be overridden
    steps = []

    # the class that we append the compiled form onto

    def __init__(self, patient_id=None, episode_id=None):
        self.episode_id = episode_id
        self.patient_id = patient_id

    @property
    def template_url(self):
        raise NotImplementedError(
            "we expect a template url to be implemented"
        )

    @property
    def episode(self):
        if self.episode_id is None:
            return None
        return Episode.objects.get(id=self.episode_id)

    @property
    def patient(self):
        if self.patient_id is None:
            return None
        return Patient.objects.get(id=self.patient_id)

    def get_template_url(self, is_modal):
        if is_modal and hasattr(self, "modal_template_url"):
            return self.modal_template_url
        return self.template_url

    def get_pathway_insert(self, is_modal):
        if is_modal and hasattr(self, "modal_pathway_insert"):
            return self.modal_pathway_insert
        return self.pathway_insert

    def get_step_wrapper_template_url(self, is_modal):
        return self.step_wrapper_template_url

    def get_step_wrapper_template(self, is_modal):
        return self.step_wrapper_template

    def get_pathway_service(self, is_modal):
        return self.pathway_service

    @property
    def slug(self):
        return slugify(self.__class__.__name__)

    @classmethod
    def get_template_names(klass):
        return ['pathway/pathway_detail.html']

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
                all_steps.append(Step(model=step))
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
        steps_info = []

        for step in self.steps:
            if inspect.isclass(step) and issubclass(step, models.Model):
                steps_info.append(Step(model=step).to_dict())
            else:
                steps_info.append(step.to_dict())

        return dict(
            steps=steps_info,
            finish_button_text=self.finish_button_text,
            finish_button_icon=self.finish_button_icon,
            display_name=self.display_name,
            icon=getattr(self, "icon", None),
            save_url=self.save_url(),
            pathway_insert=self.get_pathway_insert(is_modal),
            template_url=self.get_template_url(is_modal),
            pathway_service=self.get_pathway_service(is_modal),
            step_wrapper_template_url=self.get_step_wrapper_template_url(
                is_modal
            )
        )


class WizardPathway(Pathway, AbstractBase):
    pathway_service = "WizardPathway"
    template_url = "/templates/pathway/wizard_pathway.html"
    modal_template_url = "/templates/pathway/modal_wizard_pathway.html"
    step_wrapper_template_url = "/templates/pathway/step_wrappers/wizard.html"
    pathway_insert = ".pathwayInsert"
    modal_pathway_insert = ".modal-content"

    def get_step_wrapper_template_url(self, is_modal):
        if is_modal:
            return "/templates/pathway/step_wrappers/modal_wizard.html"
        else:
            return super(WizardPathway, self).get_step_wrapper_template_url(is_modal)


class PagePathway(Pathway, AbstractBase):
    """
    An unrolled pathway will display all of it's forms
    at once, rather than as a set of steps.
    """
    template_url = "/templates/pathway/page_pathway.html"
    modal_template_url = "/templates/pathway/modal_page_pathway.html"
    step_wrapper_template_url = "/templates/pathway/step_wrappers/page.html"
    modal_pathway_insert = ".modal-content"

    def get_step_wrapper_template_url(self, is_modal):
        if len(self.steps) > 1:
            return super(PagePathway, self).get_step_wrapper_template_url(is_modal)
        else:
            return "/templates/pathway/step_wrappers/default.html"
