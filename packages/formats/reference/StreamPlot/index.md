---
name: StreamPlot
domain: Graphics
signature: StreamPlot(...)
summary: The streamlines of a vector field.
names:
  wolframIdentity: true
options:
  - ColorFunction
  - PlotLabel
  - XLabel
  - YLabel
signatures:
  - call: StreamPlot(...)
    description: The streamlines of a vector field.
    library: enumeratio-formats
    type: (any*) -> any
---

`StreamPlot((fx, fy), (x, a, b), (y, c, d))` draws curves that follow the field, with arrowheads showing the direction. `ColorFunction` names the gradient.
