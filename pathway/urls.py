"""
Urls for the pathway OPAL plugin
"""
from django.conf.urls import patterns, url

from pathway import views

urlpatterns = patterns(
    '',
    url(r'^pathway/$', views.PathwayIndexView.as_view()),
    url(r'^pathway/detail/(?P<name>[a-z_]+)$',
        views.PathwayDetailView.as_view()),
    url(r'^pathway/templates/(?P<name>[a-z_]+.html)$',
        views.PathwayTemplateView.as_view()),
    url(r'^pathway/c/(?P<name>[a-z_]+.html)$',
        views.PathwayTemplateView.as_view()),
)

urlpatterns += views.router.urls
