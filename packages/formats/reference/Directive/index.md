---
name: Directive
domain: Graphics
signature: Directive(directive, ...)
summary: "Wolfram's Directive, held inert: several graphics directives as one, so a single style can be a color, a thickness and a dashing together."
names:
  wolframIdentity: true
seeAlso:
  - Style
  - Graphics
signatures:
  - call: Directive(directive, ...)
    description: "Wolfram's Directive, held inert: several graphics directives as one, so a single style can be a color, a thickness and a dashing together."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
