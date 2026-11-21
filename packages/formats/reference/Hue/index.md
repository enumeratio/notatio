---
name: Hue
domain: Graphics
signature: Hue(h, s, b)
summary: "Wolfram's Hue, held inert: a color by hue, saturation and brightness, each from 0 to 1; saturation and brightness are 1 when left out."
names:
  wolframIdentity: true
seeAlso:
  - RGBColor
  - GrayLevel
signatures:
  - call: Hue(h, s, b)
    description: "Wolfram's Hue, held inert: a color by hue, saturation and brightness, each from 0 to 1; saturation and brightness are 1 when left out."
    library: enumeratio-formats
    type: (any*) -> any
---

Read inside a `Graphics`, and in a plot's `Epilog`, `Prolog` and `PlotStyle`.
