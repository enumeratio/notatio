---
name: ListDensityPlot
domain: Graphics
signature: ListDensityPlot(...)
summary: A grid of values as colored cells.
names:
  wolframIdentity: true
options:
  - ColorFunction
  - FrameLabel
  - PlotLabel
  - PlotLegends
  - PlotRange
  - RegionFunction
  - XLabel
  - YLabel
signatures:
  - call: ListDensityPlot(...)
    description: A grid of values as colored cells.
    library: enumeratio-formats
    type: (any*) -> any
---

`ListDensityPlot(rows)` colors one cell per entry of a matrix, row 0 at the bottom. It takes `DensityPlot`'s options for the gradient, the scale and the color bar.
