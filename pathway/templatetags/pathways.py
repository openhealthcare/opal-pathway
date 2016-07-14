from django import template
register = template.Library()


@register.inclusion_tag('_helpers/multisave.html')
def multisave(*args, **kwargs):
    ctx = {}

    if len(args)    :
        model = args[0]
        ctx["form_url"] = model.get_form_url()
        ctx["label"] = model.get_display_name()
        ctx["model"] = "editing.{}".format(model.get_api_name())

    if "form_url" in kwargs:
        ctx["form_url"] = kwargs["form_url"]

    if "label" in kwargs:
        ctx["label"] = kwargs["label"]

    if "model" in kwargs:
        ctx["model"] = kwargs["model"]

    return ctx
