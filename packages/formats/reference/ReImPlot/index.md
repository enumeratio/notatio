---
name: ReImPlot
domain: Graphics
signature: ReImPlot(f, (x, xmin, xmax))
summary: The real and imaginary parts of a complex function of a real variable.
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
    description: The real and imaginary parts of a complex function of a real variable.
    library: enumeratio-formats
    type: (any*) -> any
---

`ReImPlot(f, (x, a, b))` draws `Re f` and `Im f` as two curves. It evaluates the elementary functions, powers, `Gamma` and the zeta family, and takes `Plot`'s options.
