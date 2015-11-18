from models import Diagnosis, Lines, Antimicrobials


class Pathway(object):
    title = ""
    steps = (
        # model or
        # "controller.js", "something.html"
    )

class BloodCulturePathway(Pathway):
    title = "Blood Culture"
    steps = (
        Diagnosis,
        Lines,
        Antimicrobials
    )
