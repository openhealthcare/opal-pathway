from django import template
register = template.Library()


@register.inclusion_tag('_helpers/multisave.html')
def multisave(*args, **kwargs):
    ctx = {"initialise_empty": 1}
    subrecord = args[0]
    ctx["subrecord"] = subrecord
    ctx["model"] = "editing.{}".format(subrecord.get_api_name())

    if "initialise_empty" in kwargs:
        if not kwargs["initialise_empty"]:
            ctx["initialise_empty"] = 0
        else:
            ctx["initialise_empty"] = kwargs["initialise_empty"]

    return ctx
