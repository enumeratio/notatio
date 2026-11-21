---
name: EdgeForm
domain: Graphics
signature: EdgeForm(directive)
summary: "Wolfram's EdgeForm, held inert: the outline of a filled primitive is drawn as the directive says. A filled primitive has no outline without one."
names:
  wolframIdentity: true
seeAlso:
  - FaceForm
  - Directive
signatures:
  - call: EdgeForm(directive)
    description: "Wolfram's EdgeForm, held inert: the outline of a filled primitive is drawn as the directive says. A filled primitive has no outline without one."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
