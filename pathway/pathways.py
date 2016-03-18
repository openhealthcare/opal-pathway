import inspect
from copy import copy

from django.core.urlresolvers import reverse
from django.conf import settings
from django.db import models, transaction
from django.utils.text import slugify
from django.http import Http404

from opal.core import discoverable
from opal.models import Patient, Episode, EpisodeSubrecord
from opal.utils import stringport
from opal.utils import _itersubclasses

# So we only do it once
IMPORTED_FROM_APPS = False


def import_from_apps():
    """
    Iterate through installed apps attempting to import app.wardrounds
    This way we allow our implementation, or plugins, to define their
    own ward rounds.
    """
    for app in settings.INSTALLED_APPS:
        try:
            stringport(app + '.pathways')
        except ImportError as e:
            pass  # not a problem
    global IMPORTED_FROM_APPS
    IMPORTED_FROM_APPS = True
    return


class Step(object):
    def __init__(self, model=None, **kwargs):
        self.model = model
        self.other_args = kwargs

    def to_dict(self):
        # this needs to handle singletons and whether we should update
        result = {}
        if self.model:
            result.update(dict(
                template_url=reverse("form_template_view", kwargs=dict(model=self.model)),
                title=self.model.get_display_name(),
                icon=getattr(self.model, "_icon", None),
                api_name=self.model.get_api_name()
            ))


        result.update(self.other_args)
        return result

    def save(self, data, user, episode=None, new_episode=True):
        if not self.model:
            return

        update_field = copy(data.get(self.model.get_api_name(), []))

        if len(update_field) > 1 and self.model._is_singleton:
            raise ValueError("Multiple values for a singleton received")

        instances = []

        for update_info in update_field:
            if not update_info or not any(update_info.itervalues()):
                return

            if 'id' in update_info:
                instance = self.model.objects.get(id=update_info['id'])
            else:
                if issubclass(self.model, EpisodeSubrecord):
                    instance = self.model(episode=episode)
                else:
                    instance = self.model(patient=episode.patient)

            if self.model._is_singleton:
                if issubclass(self.model, EpisodeSubrecord):
                    instance = self.model.objects.get(episode=episode)
                else:
                    instance = self.model.objects.get(patient=episode.patient)

                if new_episode:
                    update_info['consistency_token'] = instance.consistency_token

            instance.update_from_dict(update_info, user)
            instances.append(instance)
        return instances


class DemographicsStep(Step):
    def save(self, data, user, **kw):
        update_info = copy(data.get(self.model.get_api_name(), None))
        if 'consistency_token' not in update_info:
            return
        return super(DemographicsStep, self).save(data, user, **kw)


class MultSaveStep(Step):
    def to_dict(self):
        result = super(MultSaveStep, self).to_dict()

        if "template_url" not in self.other_args:
            result["template_url"] = "/templates/pathway/multi_save.html"

        if "controller_class" not in self.other_args:
            result["controller_class"] = "MultiSaveCtrl"

        result["model_form_url"] = reverse(
            "form_template_view", kwargs=dict(model=self.model)
        )
        result["record_url"] = reverse(
            "record_view", kwargs=dict(model=self.model)
        ),
        return result


class RedirectsToPatientMixin(object):
    def redirect_url(self, episode):
        return "/#/patient/{0}".format(episode.patient.id)


class RedirectsToEpisodeMixin(object):
    def redirect_url(self, episode):
        return "/#/patient/{0}/{1}".format(episode.patient.id, episode.id)


class Pathway(discoverable.DiscoverableFeature):
    module_name = "pathways"

    # any iterable will do, this should be overridden
    steps = []

    def __init__(self, episode_id=None):
        self.episode_id = episode_id

    @property
    def episode(self):
        if self.episode_id is None:
            return None
        return Episode.objects.get(id=self.episode_id)

    @property
    def slug(self):
        return slugify(self.__class__.__name__)

    @classmethod
    def get(klass, slug):
        """
        Return a specific referral route by slug
        """
        for pathway in klass.list():
            if pathway().slug == slug:
                return pathway

        raise Http404("Pathway does not exist")

    @classmethod
    def list(klass):
        """
        Return a list of all ward rounds
        """
        if not IMPORTED_FROM_APPS:
            import_from_apps()

        return _itersubclasses(klass)

    @classmethod
    def get_template_names(klass):
        names = ['pathway/pathway_detail.html']
        if klass.slug:
            names.insert(0, 'pathway/{0}.html'.format(klass.slug))
        return names

    def save_url(self):
        return reverse("pathway_create", kwargs=dict(name=self.slug))

    def redirect_url(save, episode):
        return None

    def _save_for_new_patient(self, patient, data, user):
        patient.update_from_demographics_dict(data['demographics'][0], user)

        episode = patient.create_episode()

        for step in self.get_steps():
            step.save(data, user, episode=episode, new_episode=True)
        return episode

    def _update_episode(self, episode, data, user):
        for step in self.get_steps():
            step.save(data, user, episode=episode)
        return episode

    def _create_episode_then_save(self, patient, data, user):
        episode = patient.create_episode()
        for step in self.get_steps():
            step.save(data, user, episode=episode, new_episode=True)
        return episode

    def save(self, data, user):
        with transaction.atomic():
            if self.episode_id:
                return self._update_episode(self.episode, data, user)

            demographics = data.get("demographics", None)

            if demographics is None:
                raise ValueError('We need either demographics or an episode id to save to a patient')

            demographics = demographics[0]

            hospital_number = demographics["hospital_number"]

            patient, created = Patient.objects.get_or_create(
                demographics__hospital_number=hospital_number
            )

            if created:
                return self._save_for_new_patient(patient, data, user)
            else:
                return self._create_episode_then_save(patient, data, user)

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
            save_url=self.save_url()
        )


class UnrolledPathway(Pathway):
    """
    An unrolled pathway will display all of it's forms
    at once, rather than as a set of steps.
    """

    def to_dict(self):
        as_dict = super(UnrolledPathway, self).to_dict()
        as_dict['unrolled'] = True
        return as_dict
