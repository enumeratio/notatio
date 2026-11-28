---
name: RegionPlot
domain: Graphics
signature: RegionPlot(pred, (x, xmin, xmax), (y, ymin, ymax))
summary: The region of the plane where a predicate holds.
names:
  wolframIdentity: true
options:
  - BoundaryStyle
  - ColorFunction
  - ColorMixing
  - FrameLabel
  - PlotLabel
  - PlotPoints
  - PlotStyle
  - RegionFunction
  - XLabel
  - YLabel
optionValues:
  ColorMixing:
    - Normal
    - Screen
    - Add
    - Multiply
seeAlso:
  - ContourPlot
  - DensityPlot
  - Show
signatures:
  - call: RegionPlot(pred, (x, xmin, xmax), (y, ymin, ymax))
    description: The region of the plane where a predicate holds.
    library: enumeratio-formats
    type: (any*) -> any
  - call: RegionPlot([pred1, pred2, ...], (x, xmin, xmax), (y, ymin, ymax))
    description: a region for each predicate, in the category colors, mixed where they overlap
    library: enumeratio-formats
    type: (any*) -> any
---

`RegionPlot(pred, (x, a, b), (y, c, d))` shades where inequalities, chained or joined by `&&`, `||` and `!`, are true, and outlines the boundary. A list of predicates draws one region each, `PlotStyle` sets the fill and `BoundaryStyle` the outline; an equation draws nothing here, use `ContourPlot`.
