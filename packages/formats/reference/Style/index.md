---
name: Style
domain: Graphics
signature: Style(primitive, directive, ...)
summary: "Wolfram's Style, held inert: one primitive drawn with the directives given, and nothing after it."
names:
  wolframIdentity: true
seeAlso:
  - Directive
  - Graphics
signatures:
  - call: Style(primitive, directive, ...)
    description: "Wolfram's Style, held inert: one primitive drawn with the directives given, and nothing after it."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
