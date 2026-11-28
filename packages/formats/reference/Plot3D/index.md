---
name: Plot3D
domain: Graphics
signature: Plot3D(...)
summary: A function of two variables as a surface.
names:
  wolframIdentity: true
options:
  - Axes
  - ColorFunction
  - Gpu
  - PlotLabel
  - PlotLegends
  - ScalingFunctions
signatures:
  - call: Plot3D(...)
    description: A function of two variables as a surface.
    library: enumeratio-formats
    type: (any*) -> any
---

`Plot3D(f, (x, a, b), (y, c, d))` draws the surface `z = f(x, y)`, and a list of expressions draws one surface each. `ColorFunction` names the gradient, `PlotLegends -> True` adds a color bar and `Gpu -> True` evaluates on the graphics card.
