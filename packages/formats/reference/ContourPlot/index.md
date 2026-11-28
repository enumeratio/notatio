---
name: ContourPlot
domain: Graphics
signature: ContourPlot(...)
summary: Contours of a function of two variables, or the curve where an equation holds.
names:
  wolframIdentity: true
options:
  - ColorFunction
  - ContourShading
  - Contours
  - FrameLabel
  - PlotLabel
  - PlotPoints
  - RegionFunction
  - XLabel
  - YLabel
seeAlso:
  - RegionPlot
  - DensityPlot
signatures:
  - call: ContourPlot(...)
    description: Contours of a function of two variables, or the curve where an equation holds.
    library: enumeratio-formats
    type: (any*) -> any
---

`ContourPlot(f, (x, a, b), (y, c, d))` draws level curves of `f`, and `ContourPlot(f == g, …)` the curve where the two sides agree. `Contours` chooses the levels, `ContourShading -> True` fills the bands between them, and `RegionFunction` keeps the plot to a region.
