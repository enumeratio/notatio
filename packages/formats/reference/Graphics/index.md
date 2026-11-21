---
name: Graphics
domain: Graphics
signature: Graphics(primitives, options)
summary: "Wolfram's Graphics, held inert: primitives drawn in a frame of their own, each styled by the directives before it."
names:
  wolframIdentity: true
attributes:
  - HoldAll
options:
  - AspectRatio
  - Axes
  - AxesLabel
  - Frame
  - FrameLabel
  - GridLines
  - PlotLabel
  - PlotRange
seeAlso:
  - Show
  - Plot
  - RegionPlot
signatures:
  - call: Graphics(primitives)
    description: the primitives, in a frame that holds them
    library: enumeratio-formats
    type: (any*) -> any
  - call: Graphics(primitives, options)
    description: the same, with the frame's options
    library: enumeratio-formats
    type: (any*) -> any
---

The primitives are `Point`, `Line`, `Arrow`, `Polygon`, `Triangle`, `Rectangle`, `Circle`, `Disk`, `Annulus`, `BezierCurve`, `BSplineCurve` and `Text`, alone or in a list. `Circle` and `Disk` take a radius or `(rx, ry)`, and a pair of angles for an arc or a sector. `Line` and `Arrow` take one path or a list of them. `Translate`, `Rotate` and `Scale` move what they hold, and `GraphicsComplex(points, primitives)` names its points by index. Coordinates are numbers, written with `Pi` and arithmetic where that reads better.

A directive in a list styles every primitive after it in that list and in the lists inside it, and ends where its list ends. `Style(primitive, directive, …)` styles one primitive, and `Directive(…)` groups several. The directives are the colors (`Red`, `"#rrggbb"`, `RGBColor`, `GrayLevel`, `Hue`), `Opacity`, `Thickness` and `AbsoluteThickness` (and `Thin`, `Thick`), `Dashing` and `AbsoluteDashing` (and `Dashed`, `Dotted`, `DotDashed`), `PointSize` and `AbsolutePointSize`, `Arrowheads`, `EdgeForm` and `FaceForm`. A size given as a fraction is of the figure's width; the `Absolute` forms are pixels. With no directive in force a primitive is drawn in the page's text color, a filled one opaque and without an outline.

Draws as a `GraphicsBox` in the primitives' own coordinates, one unit of x as long as one of y. The window is `PlotRange -> ((xmin, xmax), (ymin, ymax))`, or the primitives' extent. `Axes -> True` and `Frame -> True` draw the axes or a frame, `AxesLabel` and `FrameLabel` caption them, `GridLines -> True` rules the plane, `AspectRatio -> r` sets the figure's shape, and `PlotLabel` titles it. A plot's `Epilog` and `Prolog` are read the same way.
