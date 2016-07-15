"""
Plugin definition for the pathway OPAL plugin
"""
from opal.core import plugins
from pathway.urls import urlpatterns
from django.conf import settings

DISPLAY_MENU = getattr(settings, 'PATHWAY_MENU_ITEM', True)

if DISPLAY_MENU:
    menuitems = [
        dict(
            href='/pathway/#/', display='Pathway', icon='fa fa-mail-forward',
            activepattern='/pathway', index=2)
    ]
else:
    menuitems = []

class PathwayPlugin(plugins.OpalPlugin):
    """
    Main entrypoint to expose this plugin to our OPAL application.
    """
    urls = urlpatterns

    javascripts = {
        # Add your javascripts here!
        'opal.controllers': [
            'js/pathway/app.js',
            'js/pathway/controllers/pathway.js',
            'js/pathway/controllers/modal_pathway.js',
            'js/pathway/controllers/find_patient.js',
            'js/pathway/controllers/line_controller.js',
            'js/pathway/controllers/multi_stage_default.js',
            'js/pathway/services/multi_stage_form.js',
            'js/pathway/services/pathway_loader.js',
            'js/pathway/directives.js',
        ]
    }

    def restricted_teams(self, user):
        """
        Return any restricted teams for particualr users that our
        plugin may define.
        """
        return []

    def list_schemas(self):
        """
        Return any patient list schemas that our plugin may define.
        """
        return {}

    def flows(self):
        """
        Return any custom flows that our plugin may define
        """
        return {}

    def roles(self, user):
        """
        Given a (Django) USER object, return any extra roles defined
        by our plugin.
        """
        return {}


plugins.register(PathwayPlugin)
