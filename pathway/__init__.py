"""
Plugin definition for the pathway OPAL plugin
"""
from opal.core import plugins
from pathway.urls import urlpatterns
from django.conf import settings

menuitems = []
DISPLAY_MENU = getattr(settings, 'PATHWAY_MENU_ITEM', True)

if DISPLAY_MENU:
    menuitems = [
        dict(
            href='/pathway/#/', display='Pathway', icon='fa fa-mail-forward',
            activepattern='/pathway', index=2)
    ]


class PathwayPlugin(plugins.OpalPlugin):
    """
    Main entrypoint to expose this plugin to our OPAL application.
    """
    urls = urlpatterns

    javascripts = {
        # Add your javascripts here!
        'opal.controllers': [
            'js/pathway/app.js',
            'js/pathway/controllers/pathway_creator.js',
            'js/pathway/controllers/pathway_redirect.js',
            'js/pathway/controllers/default_step.js',
            'js/pathway/controllers/modal_pathway_creator.js',
            'js/pathway/controllers/find_patient.js',
            'js/pathway/controllers/line_controller.js',
            'js/pathway/controllers/single_step.js',
            'js/pathway/services/pathway.js',
            'js/pathway/services/wizard_pathway.js',
            'js/pathway/services/pathway_defaults.js',
            'js/pathway/services/pathway_scope_compiler.js',
            'js/pathway/services/pathway_template_loader.js',
            'js/pathway/services/pathway_loader.js',
            'js/pathway/directives.js',
        ]
    }

plugins.register(PathwayPlugin)
