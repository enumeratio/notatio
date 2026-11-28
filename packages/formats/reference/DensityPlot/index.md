---
name: DensityPlot
domain: Graphics
signature: DensityPlot(...)
summary: A function of two variables as a field of color.
names:
  wolframIdentity: true
options:
  - ColorFunction
  - FrameLabel
  - PlotLabel
  - PlotLegends
  - PlotPoints
  - PlotRange
  - RegionFunction
  - XLabel
  - YLabel
signatures:
  - call: DensityPlot(...)
    description: A function of two variables as a field of color.
    library: enumeratio-formats
    type: (any*) -> any
---

`DensityPlot(f, (x, a, b), (y, c, d))` colors each cell by the value of `f`. `ColorFunction` names the gradient, `PlotRange` pins the scale, `PlotLegends -> True` adds a color bar and `RegionFunction` leaves clear whatever lies outside a predicate.
