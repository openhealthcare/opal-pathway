from django import template
register = template.Library()


@register.inclusion_tag('_helpers/multisave.html')
def multisave(*args, **kwargs):
    ctx = {}
    subrecord = args[0]
    ctx["subrecord"] = subrecord
    ctx["model"] = "editing.{}".format(subrecord.get_api_name())
    return ctx
