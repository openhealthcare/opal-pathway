"""
Views for the pathway OPAL Plugin
"""
from django.views.generic import TemplateView
from pathway.pathways import Pathway
from opal.core.views import LoginRequiredMixin


class PathwayIndexView(LoginRequiredMixin, TemplateView):
    """
    Main entrypoint into the pathway portal service.

    Lists our pathway routes.
    """
    template_name = 'pathway/index.html'


class PathwayTemplateView(TemplateView):
    def dispatch(self, *args, **kwargs):
        self.name = kwargs.get('name', 'pathway')
        self.pathway = Pathway.get(self.name)
        return super(PathwayTemplateView, self).dispatch(*args, **kwargs)

    def get_template_names(self, *args, **kwargs):
        return self.pathway.get_template_names()
