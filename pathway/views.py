"""
Views for the pathway OPAL Plugin
"""
# from django.views.generic import View

# You might find these helpful !
# from opal.core.views import LoginRequiredMixin, _build_json_response

class PathwayIndexView(LoginRequiredMixin, TemplateView):
    """
    Main entrypoint into the pathway portal service.

    Lists our pathway routes.
    """
    template_name = 'pathway/index.html'


class PathwayTemplateView(TemplateView):
    def dispatch(self, *args, **kwargs):
        self.name = kwargs['name']
        return super(pathwayTemplateView, self).dispatch(*args, **kwargs)

    def get_template_names(self, *args, **kwargs):
        return ['pathway/'+self.name, 'pathway/pathway.html']

    def get_context_data(self, *args, **kwargs):
        context = super(PathwayTemplateView, self).get_context_data(**kwargs)
        context['pathway_routes'] = PathwayRoute.list()
        return context
