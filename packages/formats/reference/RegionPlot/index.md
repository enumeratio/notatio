---
name: RegionPlot
domain: Graphics
signature: RegionPlot(pred, (x, xmin, xmax), (y, ymin, ymax))
summary: "Wolfram's RegionPlot, held inert: the region of the plane where a predicate holds, filled, with its boundary drawn."
names:
  wolframIdentity: true
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
    description: the region where pred holds
    library: enumeratio-formats
    type: (any*) -> any
  - call: RegionPlot([pred1, pred2, ...], (x, xmin, xmax), (y, ymin, ymax))
    description: a region for each predicate, in the category colors, mixed where they overlap
    library: enumeratio-formats
    type: (any*) -> any
---

A predicate is built from inequalities (`<`, `<=`, `>`, `>=`, and chains such as `1 < x^2 + y^2 < 4`) joined by `&&`, `||` and `!`. It is drawn from its margin, a real function that is positive inside: `a < b` has margin `b - a`, `&&` takes the least of its parts' margins, `||` the greatest, and `!` negates. Any other predicate (`Element(x, Integers)`, an equation) has no margin, and the plot draws nothing rather than guess; an equation's curve is `ContourPlot(f == g, …)`. Strict and non-strict inequalities draw alike.

Draws as a `GraphicsBox` of data coordinates: one `RasterBox` of the fills, a cell shaded by the share of it the region holds, and a `LineBox` along each region's boundary. `PlotPoints` is the samples per side.

`PlotStyle` is the fill, a color or `Opacity(a, color)`, or a list with one for each region; `BoundaryStyle` is one color for every boundary, or `None`. Overlapping regions are painted each over the last unless `ColorMixing` says otherwise. `RegionFunction -> pred` keeps the plot to a further region, `FrameLabel -> [x, y]` captions the frame, and `PlotLabel` the figure.
