---
name: FaceForm
domain: Graphics
signature: FaceForm(directive)
summary: "Wolfram's FaceForm, held inert: the inside of a filled primitive is drawn as the directive says; FaceForm() leaves it empty."
names:
  wolframIdentity: true
seeAlso:
  - EdgeForm
  - Directive
signatures:
  - call: FaceForm(directive)
    description: "Wolfram's FaceForm, held inert: the inside of a filled primitive is drawn as the directive says; FaceForm() leaves it empty."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
