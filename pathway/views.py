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


class PathwayDetailView(LoginRequiredMixin, View):
    """
    Return a JSON serialised pathway
    """
    def get(self, *args, **kwargs):
        pathway = Pathway.get(kwargs['name'])()
        serialised = _build_json_response(
            pathway.to_dict()
        )
        return serialised


class PathwayTemplateView(TemplateView):
    def dispatch(self, *args, **kwargs):
        self.name = kwargs.get('name', 'pathway')
        self.pathway = Pathway.get(self.name)
        return super(PathwayTemplateView, self).dispatch(*args, **kwargs)

    def get_template_names(self, *args, **kwargs):
        return self.pathway.get_template_names()


class SavePathway(mixins.CreateModelMixin, viewsets.GenericViewSet):
    def dispatch(self, *args, **kwargs):
        self.name = kwargs.pop('name', 'pathway')
        return super(SavePathway, self).dispatch(*args, **kwargs)

    def create(self, request):
        pathway = Pathway.get(self.name)()
        data = _get_request_data(request)
        episode = pathway.save(data, request.user)
        return Response({"episode_id": episode.id, "patient_id": episode.patient.id})
