---
name: Opacity
domain: Graphics
signature: Opacity(a)
summary: "Wolfram's Opacity, held inert: what follows is drawn with opacity a, from 0 to 1. Opacity(a, color) is that color with its own opacity."
names:
  wolframIdentity: true
seeAlso:
  - RGBColor
  - Directive
signatures:
  - call: Opacity(a)
    description: "Wolfram's Opacity, held inert: what follows is drawn with opacity a, from 0 to 1. Opacity(a, color) is that color with its own opacity."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
