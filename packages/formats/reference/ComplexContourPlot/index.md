---
name: ComplexContourPlot
domain: Graphics
signature: ComplexContourPlot(f, (z, zmin, zmax))
summary: Level curves of the real and imaginary parts of a complex function.
names:
  wolframIdentity: true
attributes:
  - HoldAll
options:
  - ColorFunction
  - Contours
  - FrameLabel
  - PlotLabel
  - PlotPoints
seeAlso:
  - ReImPlot
  - AbsArgPlot
  - ComplexPlot
  - ContourPlot
signatures:
  - call: ComplexContourPlot(f, (z, zmin, zmax))
    description: Level curves of the real and imaginary parts of a complex function.
    library: enumeratio-formats
    type: (any*) -> any
---

`ComplexContourPlot(f, (z, zmin, zmax))` draws the contours of `Re f` and `Im f` over the rectangle with corners `zmin` and `zmax`. `Contours -> n` asks for about `n` levels of each, and `PlotPoints` is the samples per side.
