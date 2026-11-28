---
name: ListContourPlot
domain: Graphics
signature: ListContourPlot(...)
summary: Contours of a grid of values.
names:
  wolframIdentity: true
options:
  - ColorFunction
  - ContourShading
  - Contours
  - FrameLabel
  - PlotLabel
  - RegionFunction
  - XLabel
  - YLabel
signatures:
  - call: ListContourPlot(...)
    description: Contours of a grid of values.
    library: enumeratio-formats
    type: (any*) -> any
---

`ListContourPlot(rows)` draws level curves through a matrix of numbers, row 0 at the bottom. It takes `ContourPlot`'s options for levels and shading.
