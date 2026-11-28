---
name: AbsArgPlot
domain: Graphics
signature: AbsArgPlot(f, (x, xmin, xmax))
summary: The modulus of a complex function of a real variable, colored by its argument.
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
  - ReImPlot
  - ComplexContourPlot
  - ComplexPlot
  - Plot
signatures:
  - call: AbsArgPlot(f, (x, xmin, xmax))
    description: The modulus of a complex function of a real variable, colored by its argument.
    library: enumeratio-formats
    type: (any*) -> any
---

`AbsArgPlot(f, (x, a, b))` draws `|f|` as one curve whose color follows the argument: red at 0, cyan at π. It evaluates the elementary functions, powers, `Gamma` and the zeta family, and takes `Plot`'s options.
