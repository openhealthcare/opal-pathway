import inspect
from functools import wraps

from django.core.urlresolvers import reverse
from django.db import models, transaction
from django.utils.text import slugify

from opal.core import discoverable, exceptions
from opal.models import Patient, Episode, EpisodeSubrecord, PatientSubrecord


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

    existing_data = data[model.get_api_name()]
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
    def title(self):
        return self.model.get_display_name()

    @extract_pathway_field
    def icon(self):
        return getattr(self.model, "_icon", None)

    @extract_pathway_field
    def api_name(self):
        return self.model.get_api_name()

    @extract_pathway_field
    def controller_class(self):
        return "SingleStepCtrl"

    def to_dict(self):
        # this needs to handle singletons and whether we should update
        result = {}

        if self.model:
            result.update(dict(
                template_url=self.template_url(),
                title=self.title(),
                icon=self.icon(),
                api_name=self.api_name(),
                controller_class=self.controller_class()
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


class RedirectsToPatientMixin(object):
    def redirect_url(self, patient):
        return "/#/patient/{0}".format(patient.id)


class RedirectsToEpisodeMixin(object):
    def redirect_url(self, patient):
        episode = patient.episode_set.last()
        return "/#/patient/{0}/{1}".format(patient.id, episode.id)


class Pathway(discoverable.DiscoverableFeature):
    module_name = "pathways"

    # any iterable will do, this should be overridden
    steps = []

    # the class that we append the compiled form onto
    append_to = ".appendTo"

    template_url = "/templates/pathway/form_base.html"

    def __init__(self, patient_id=None, episode_id=None):
        self.episode_id = episode_id
        self.patient_id = patient_id

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

        return reverse("pathway_create", kwargs=kwargs)

    def redirect_url(save, patient):
        return None

    @transaction.atomic
    def save(self, data, user):
        patient = self.patient
        episode = self.episode

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

        patient.bulk_update(data, user, episode=episode)
        return patient

    def get_steps(self):
        all_steps = []
        for step in self.steps:
            if inspect.isclass(step) and issubclass(step, models.Model):
                all_steps.append(Step(model=step))
            else:
                all_steps.append(step)

        return all_steps

    def to_dict(self):
        # the dict we json to send over
        # in theory it takes a list of either models or steps
        # in reality you can swap out steps for anything with a todict method
        # we need to have a template_url, title and an icon, optionally
        # it can take a controller_class with the name of the angular
        # controller
        steps_info = []

        for step in self.steps:
            if inspect.isclass(step) and issubclass(step, models.Model):
                steps_info.append(Step(model=step).to_dict())
            else:
                steps_info.append(step.to_dict())

        return dict(
            steps=steps_info,
            title=self.display_name,
            icon=getattr(self, "icon", None),
            save_url=self.save_url(),
            append_to=self.append_to,
            template_url=self.template_url,
        )


class ModalPathway(Pathway):
    # so the theory is that we have a service that goes and gets a pathway based
    # on the url, this returns a serialised version of the pathway and opens the modal
    # doing all the work
    template_url = "/templates/pathway/modal_form_base.html"
    append_to = ".modal-content"


class UnrolledPathway(Pathway):
    """
    An unrolled pathway will display all of it's forms
    at once, rather than as a set of steps.
    """
    template_url = "/templates/pathway/unrolled_form_base.html"
