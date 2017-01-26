"""
Views for the pathway OPAL Plugin
"""
from django.views.generic import TemplateView, View
from rest_framework import viewsets, mixins
from rest_framework.response import Response
from opal.core.views import (
    LoginRequiredMixin, _get_request_data, _build_json_response,
)
from pathways import Pathway


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
