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
        self.episode_id = kwargs.get('episode_id', None)
        return super(SavePathway, self).dispatch(*args, **kwargs)

    def create(self, request, **kwargs):
        pathway = Pathway.get(self.name)(episode_id=self.episode_id)
        data = _get_request_data(request)
        patient = pathway.save(data, request.user)
        redirect = pathway.redirect_url(patient)
        return Response({
            "episode_id": patient.episode_set.last().id,
            "patient_id": patient.id,
            "redirect_url": redirect
        })
