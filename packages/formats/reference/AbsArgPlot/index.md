---
name: AbsArgPlot
domain: Graphics
signature: AbsArgPlot(f, (x, xmin, xmax))
summary: "Wolfram's AbsArgPlot, held inert: the modulus of a complex-valued function of a real variable, as a curve colored along its length by the argument."
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
    description: "Wolfram's AbsArgPlot, held inert: the modulus of a complex-valued function of a real variable, as a curve colored along its length by the argument."
    library: enumeratio-formats
    type: (any*) -> any
---

The function is evaluated by the complex evaluator `ComplexPlot` uses, which reads the elementary functions, powers, `Gamma` and the zeta family; a function outside those draws nothing and says so.

Draws as a `GraphicsBox` of one `LineBox` whose segments take the hue of the argument: red at 0, cyan at π. The frame's options are `Plot`'s.
