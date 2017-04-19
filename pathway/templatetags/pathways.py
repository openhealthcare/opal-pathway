import copy

from django import template
register = template.Library()


@register.inclusion_tag('_helpers/multisave.html', takes_context=True)
def multisave(context, subrecord):
    context = copy.copy(context)
    ctx = {}
    ctx["subrecord"] = subrecord
    ctx["model"] = "editing.{}".format(subrecord.get_api_name())
    context.update(ctx)
    return context
