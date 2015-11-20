from elcid.models import Diagnosis, Line, Antimicrobial, MicrobiologyTest
from opal.utils import camelcase_to_underscore
from django.conf import settings

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


class Pathway(object):
    title = ""
    steps = (
        # model or
        # "controller.js", "something.html"
    )

    @classmethod
    def get(klass, name):
        """
        Return a specific referral route by slug
        """
        if not IMPORTED_FROM_APPS:
            import_from_apps()

        for sub in klass.__subclasses__():
            if sub.slug() == name:
                return sub

    @classmethod
    def list(klass):
        """
        Return a list of all ward rounds
        """
        if not IMPORTED_FROM_APPS:
            import_from_apps()
        return klass.__subclasses__()

    @classmethod
    def slug(klass):
        return camelcase_to_underscore(klass.title).replace(' ', '')

    def get_steps_info(self):
        steps_info = []

        for step in self.steps:
            steps_info.append(dict(
                template_url="/templates/" + step.get_form_template(),
                title=getattr(step, "_title", step.__name__.title()),
                icon=getattr(step, "_icon", None),
            ))
        return dict(steps=steps_info, title=self.title)
