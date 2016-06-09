"""
Urls for the pathway OPAL plugin
"""
from django.conf.urls import patterns, url

from pathway import views

urlpatterns = patterns(
    '',
    url(r'^pathway/$', views.PathwayIndexView.as_view()),

    url(r'^pathway/detail/(?P<name>[a-z_]+)?$',
        views.PathwayDetailView.as_view()),

    url(
        r'^pathway/detail/(?P<name>[a-z_]+)/(?P<patient_id>[0-9]+)/(?P<episode_id>[0-9]+)?$',
        views.PathwayDetailView.as_view()
    ),

    url(
        r'^pathway/templates/(?P<name>[a-z_]+)/detail.html$',
        views.PathwayTemplateView.as_view(), name="pathway_template"
    ),

    url(
        r'^pathway/(?P<name>[a-z_]+)/save?$',
        views.SavePathway.as_view({'post': 'create'}),
        name="pathway_create"
    ),
    url(
        r'^pathway/(?P<name>[a-z_]+)/save/(?P<patient_id>[0-9]+)/(?P<episode_id>[0-9]+)?$',
        views.SavePathway.as_view({'post': 'create'}),
        name="pathway_create"
    ),

)
