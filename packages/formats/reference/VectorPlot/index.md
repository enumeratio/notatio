---
name: VectorPlot
domain: Graphics
signature: VectorPlot(...)
summary: A vector field as a grid of arrows.
names:
  wolframIdentity: true
options:
  - ColorFunction
  - PlotLabel
  - XLabel
  - YLabel
signatures:
  - call: VectorPlot(...)
    description: A vector field as a grid of arrows.
    library: enumeratio-formats
    type: (any*) -> any
---

`VectorPlot((fx, fy), (x, a, b), (y, c, d))` draws an arrow at each grid point pointing along the field there, colored by its length. `ColorFunction` names the gradient.
