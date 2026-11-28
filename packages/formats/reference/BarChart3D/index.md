---
name: BarChart3D
domain: Graphics
signature: BarChart3D(...)
summary: A matrix as bars on a grid.
names:
  wolframIdentity: true
options:
  - Axes
  - ColorFunction
  - PlotLabel
  - PlotLegends
  - ScalingFunctions
signatures:
  - call: BarChart3D(...)
    description: A matrix as bars on a grid.
    library: enumeratio-formats
    type: (any*) -> any
---

`BarChart3D(rows)` draws one bar for each entry of a matrix, and a flat list is a single row. `ColorFunction` names the gradient.
