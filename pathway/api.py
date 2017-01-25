from rest_framework import viewsets, mixins
from opal.core.views import _get_request_data, _build_json_response
from pathways import Pathway


class SavePathway(mixins.CreateModelMixin, viewsets.GenericViewSet):
    def dispatch(self, *args, **kwargs):
        self.name = kwargs.pop('name', 'pathway')
        self.episode_id = kwargs.get('episode_id', None)
        self.patient_id = kwargs.get('patient_id', None)
        return super(SavePathway, self).dispatch(*args, **kwargs)

    def create(self, request, **kwargs):
        pathway = Pathway.get(self.name)(
            patient_id=self.patient_id,
            episode_id=self.episode_id
        )
        data = _get_request_data(request)
        patient = pathway.save(data, request.user)
        redirect = pathway.redirect_url(patient)
        return _build_json_response({
            "episode_id": self.episode_id,
            "patient_id": patient.id,
            "redirect_url": redirect
        })
