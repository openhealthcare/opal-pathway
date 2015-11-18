"""
Urls for the pathway OPAL plugin
"""
from django.conf.urls import patterns, url

from pathway import views

urlpatterns = patterns(
    '',
    url('^pathway/$', views.PathwayIndexView.as_view()),
    url(r'^referral/templates/(?P<name>[a-z_]+.html)$',
        views.PathwayTemplateView.as_view()),
)
