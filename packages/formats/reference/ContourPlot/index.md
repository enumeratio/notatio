---
name: ContourPlot
domain: Graphics
signature: ContourPlot(...)
summary: Wolfram's own ContourPlot, held inert -- the expression is what a worksheet or REPL draws, not something this library computes (see @notatio/formats/src/graphics.ts).
names:
  wolframIdentity: true
seeAlso:
  - RegionPlot
  - DensityPlot
signatures:
  - call: ContourPlot(...)
    description: Wolfram's own ContourPlot, held inert -- the expression is what a worksheet or REPL draws, not something this library computes (see @notatio/formats/src/graphics.ts).
    library: enumeratio-formats
    type: (any*) -> any
---

Draws as a `GraphicsBox` of data coordinates: a `LineBox` per level, colored along the gradient (`ColorFunction`, `Reverse`), or with `ContourShading -> True` one `RasterBox` of the bands between them. `Contours` is a count or a list of values; `PlotPoints` is the samples per side.

`ContourPlot(f == g, (x, a, b), (y, c, d))` draws the implicit curve where the two sides agree, the zero contour of `f - g`; a list of equations is a curve each, in the category colors.

`RegionFunction -> pred` draws the plot only where the predicate over the plot's variables holds (`RegionFunction -> (x^2 + y^2 < 9)`). `FrameLabel -> [x, y]` captions the frame, `PlotLabel` the figure.
