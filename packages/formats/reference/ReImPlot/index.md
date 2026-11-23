---
name: ReImPlot
domain: Graphics
signature: ReImPlot(f, (x, xmin, xmax))
summary: "Wolfram's ReImPlot, held inert: the real and the imaginary part of a complex-valued function of a real variable, as two curves."
names:
  wolframIdentity: true
attributes:
  - HoldAll
options:
  - AspectRatio
  - Axes
  - AxesLabel
  - AxesOrigin
  - Frame
  - GridLines
  - PlotLabel
  - PlotLegends
  - PlotPoints
  - PlotRange
  - PlotRangePadding
  - PlotStyle
  - Ticks
seeAlso:
  - AbsArgPlot
  - ComplexContourPlot
  - ComplexPlot
  - Plot
signatures:
  - call: ReImPlot(f, (x, xmin, xmax))
    description: "Wolfram's ReImPlot, held inert: the real and the imaginary part of a complex-valued function of a real variable, as two curves."
    library: enumeratio-formats
    type: (any*) -> any
---

The function is evaluated by the complex evaluator `ComplexPlot` uses, which reads the elementary functions, powers, `Gamma` and the zeta family; a function outside those draws nothing and says so.

Draws as a `GraphicsBox` of two `LineBox`es, labeled `Re` and `Im`, sampled and zoomed as `Plot` is. The frame's options and `PlotStyle` are `Plot`'s.
