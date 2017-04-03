### 0.4

#### Overview
We now compile the templates on the server in Django rather than via Angular. They now use a directive to create a pathway step.

#### How does this effect my pathway?
Hopefully very little.

#### Things you will have to change
References to `template_url` now have to become `template`, and are included using the Django `{% include ... %}`
template tag. This means they should now be relative to the `/templates` of your plugin or application. e.g.

```python
  lots of custom step text
  class MyPathway(PagePathway):
      template = "pathway/templates/my_pathway.html"
      modal_template = "pathway/templates/modal_my_pathway.html"
```


Step template wrappers are no longer a thing, if you need to wrap a template, you can change the step template.

for example
```html
  lots of custom step text
  {% include step.model.get_form_template %}
```

If you have non singleton model step for example Treatment. This will now
display as an multi save step, because that's probably what you want.

The directive `openPathway` now no longer replaces the currently scoped episode.
If you want to replace the patient/episode you need to pass in a call back with
`pathwayCallback`

#### Things you might need to know

The way we load editing into the scope has changed. If the model is a singleton
it will come through as an object. Otherwise it will come through as an array.

The pathway save method now returns a tuple of patient, episode.

There is now a new directive pathwayLink which will add an href to a new page
pathway form using the slug of the pathway passed in.


### 0.3 Release

Significant API churn with contextualising and defining Pathways, Steps, et cetera.
See updated README for further details.

Targets Opal 0.8.x

### 0.2 Release

Targets Opal 0.7.x

### 0.1 Release

Initial release, still very alpha.

Targets Opal 0.6.x
