---
name: ComplexContourPlot
domain: Graphics
signature: ComplexContourPlot(f, (z, zmin, zmax))
summary: "Wolfram's ComplexContourPlot, held inert: the level curves of the real part and of the imaginary part of a function over a rectangle of the complex plane, in two colors."
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
    description: "Wolfram's ComplexContourPlot, held inert: the level curves of the real part and of the imaginary part of a function over a rectangle of the complex plane, in two colors."
    library: enumeratio-formats
    type: (any*) -> any
---

The function is evaluated by the complex evaluator `ComplexPlot` uses, which reads the elementary functions, powers, `Gamma` and the zeta family; a function outside those draws nothing and says so.

The iterator's corners are complex: the plot is over the rectangle they span. Draws as a `GraphicsBox` of one `LineBox` for each level of each part; `Contours -> n` asks for about n levels of each, and `PlotPoints` is the samples per side. A zoomed view keeps the whole plot's levels.
