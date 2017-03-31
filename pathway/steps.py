from functools import wraps
from opal.models import EpisodeSubrecord, PatientSubrecord
from opal.utils import camelcase_to_underscore
from opal.core import exceptions


def delete_others(data, model, patient=None, episode=None):
    """
        deletes all subrecords that are not in data
    """
    if issubclass(model, EpisodeSubrecord):
        existing = model.objects.filter(episode=episode)
    elif issubclass(model, PatientSubrecord):
        existing = model.objects.filter(patient=patient)
    else:
        err = "delete others called with {} requires a subrecord"
        raise exceptions.APIError(err.format(model.__name__))

    if model._is_singleton:
        err = "you can't mass delete a singleton for {}"
        raise exceptions.APIError(err.format(model.__name__))

    existing_data = data.get(model.get_api_name(), [])
    ids = [i["id"] for i in existing_data if "id" in i]
    existing = existing.exclude(id__in=ids)

    for i in existing:
        i.delete()


def extract_pathway_field(some_fun):
    """
        assumes a method with the name get_
        it removes the prefix and looks for that attribute in the kwargs
        otherwise looks for it on the on the step
        otherwise call through
    """
    @wraps(some_fun)
    def func_wrapper(self):
        keyword = some_fun.__name__
        if keyword.startswith("get_"):
            keyword = keyword.replace("get_", "", 1)
        if keyword in self.other_args:
            return self.other_args[keyword]
        elif hasattr(self, keyword):
            return getattr(self, keyword)
        else:
            if not self.model:
                NotImplementedError(
                    "%s needs to either be a keyword or we need a model set"
                )
            return some_fun(self)
    return func_wrapper


class Step(object):
    """
        a step object should either have a model
        or
            display name
            icon
            template
            api_name (optional)
            step_controller (optional)
            model_api_name (optional)
    """
    def __init__(self, model=None, **kwargs):
        self.model = model
        self.other_args = kwargs

    @extract_pathway_field
    def get_template(self):
        return self.model.get_form_template()

    @extract_pathway_field
    def get_display_name(self):
        return self.model.get_display_name()

    @extract_pathway_field
    def get_icon(self):
        return getattr(self.model, "_icon", None)

    @extract_pathway_field
    def get_api_name(self):
        if self.model:
            return self.model.get_api_name()
        else:
            return camelcase_to_underscore(
                self.get_display_name().replace(" ", "")
            )

    @extract_pathway_field
    def get_step_controller(self):
        if self.model and self.model._is_singleton:
            return "DefaultSingleStep"
        return "DefaultStep"

    @extract_pathway_field
    def get_model_api_name(self):
        if self.model:
            return self.model.get_api_name()

    def to_dict(self):
        # this needs to handle singletons and whether we should update
        result = dict(step_controller=self.get_step_controller())

        result.update(dict(
            display_name=self.get_display_name(),
            icon=self.get_icon(),
            api_name=self.get_api_name(),
            model_api_name=self.get_model_api_name()
        ))

        result.update(self.other_args)
        return result

    def pre_save(self, data, user, patient=None, episode=None):
        pass


class SingleModelStep(Step):
    step_controller = "DefaultSingleStep"


class MultiModelStep(Step):
    template = "pathway/steps/multi_save.html"

    def __init__(self, *args, **kwargs):
        if "model" not in kwargs:
            raise exceptions.APIError(
                "Mulitsave requires a model to be passed in"
            )
        self.delete_others = kwargs.pop("delete_others", False)
        super(MultiModelStep, self).__init__(*args, **kwargs)

    def pre_save(self, data, user, patient=None, episode=None):
        if self.delete_others:
            delete_others(data, self.model, patient=patient, episode=episode)
        super(MultiModelStep, self).pre_save(data, user, patient, episode)


class FindPatientStep(Step):
    template = "pathway/find_patient_form.html"
    step_controller = "FindPatientCtrl"
    display_name = "Find Patient"
    icon = "fa fa-user"
