---
name: Scale
domain: Graphics
signature: Scale(primitives, s, (x, y))
summary: "Wolfram's Scale, held inert: the primitives scaled by s, or by (sx, sy), about the point, or the origin when it is left out."
names:
  wolframIdentity: true
seeAlso:
  - Rotate
  - Translate
signatures:
  - call: Scale(primitives, s, (x, y))
    description: "Wolfram's Scale, held inert: the primitives scaled by s, or by (sx, sy), about the point, or the origin when it is left out."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
