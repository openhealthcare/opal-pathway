import inspect
from copy import copy

from opal.utils import camelcase_to_underscore
from django.conf import settings
from django.db import models
from django.utils.text import slugify

from opal.utils import stringport

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
        except ImportError:
            pass  # not a problem
    global IMPORTED_FROM_APPS
    IMPORTED_FROM_APPS = True
    return


class Step(object):
    def __init__(self, model=None, **kwargs):
        self.model = model
        self.other_args = kwargs

    def to_dict(self):
        result = {}
        if self.model:
            result.update(dict(
                template_url="/templates/" + self.model.get_form_template(),
                title=self.model.get_display_name(),
                icon=getattr(self.model, "_icon", None),
            ))

        result.update(self.other_args)
        return result

    def save(self, episode_id, data, user):
        if not self.model:
            return

        update_info = copy(data.get(self.model.get_api_name(), None))

        if not update_info:
            return

        update_info["episode_id"] = episode_id
        new_model = self.model()
        new_model.update_from_dict(update_info, user)
        return new_model


class Pathway(object):
    title = ""

    # any iterable will do, this should be overridden
    steps = []

    @property
    def slug(self):
        return slugify(self.title)

    @classmethod
    def get(klass, slug):
        """
        Return a specific referral route by slug
        """
        if not IMPORTED_FROM_APPS:
            import_from_apps()

        for sub in klass.__subclasses__():
            if sub().slug == slug:
                return sub

    @classmethod
    def list(klass):
        """
        Return a list of all ward rounds
        """
        if not IMPORTED_FROM_APPS:
            import_from_apps()
        return klass.__subclasses__()

    @property
    def slug(klass):
        return camelcase_to_underscore(klass.title).replace(' ', '')

    def get_steps(self):
        all_steps = []
        for step in self.steps:
            if inspect.isclass(step) and issubclass(step, models.Model):
                all_steps.append(Step(model=step))
            else:
                all_steps.append(step)

        return all_steps

    def get_steps_info(self):
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

        return dict(steps=steps_info, title=self.title)
