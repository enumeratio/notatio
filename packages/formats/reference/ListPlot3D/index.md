---
name: ListPlot3D
domain: Graphics
signature: ListPlot3D(...)
summary: A surface through a grid of heights or a set of points.
names:
  wolframIdentity: true
options:
  - Axes
  - ColorFunction
  - PlotLabel
  - PlotLegends
  - ScalingFunctions
  - Type
signatures:
  - call: ListPlot3D(...)
    description: A surface through a grid of heights or a set of points.
    library: enumeratio-formats
    type: (any*) -> any
---

`ListPlot3D(rows)` draws the surface through a matrix of heights, and a list of triples `(x, y, z)` is joined into a surface; `Type -> "points"` draws them as a scatter. `ColorFunction` names the gradient.
