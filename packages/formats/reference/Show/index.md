---
name: Show
domain: Graphics
signature: Show(layers..., options...)
summary: "Wolfram's Show: layers drawn in one coordinate frame, sharing one view. Held as written, so a layer's ColorRules name the properties it publishes rather than compute-engine's heads."
names:
  wolframIdentity: true
options:
  - AspectRatio
  - Axes
  - AxesLabel
  - AxesStyle
  - Frame
  - FrameLabel
  - GestureHandling
  - GridLines
  - GridLinesStyle
  - ImageSize
  - Magnification
  - PlotLabel
  - PlotRange
  - ProjectionMatrix
  - Selection
  - SphericalRegion
  - Ticks
  - ViewAngle
  - ViewCenter
  - ViewPoint
  - ViewVertical
signatures:
  - call: Show(layers..., options...)
    description: the layers in one frame, sharing one view
    library: enumeratio-formats
    type: (any*) -> any
attributes:
  - HoldAll
seeAlso:
  - Labeled
  - ArrayPlot
---

`Show(LatticeTiles(QuadraticIntegers(-5), ColorRules -> [IsPrime -> Teal]), GridLines -> [10, 10])`
draws the primes of ℤ[√−5] over a grid every 10 units along each axis of the lattice. Its layers
(`LatticeTiles`, `ArrayPlot`) style their elements by `ColorRules`, `ColorMixing` and
`BoundaryStyle`; its options are Wolfram's (`GridLines`, `Axes`, `AspectRatio`, `ImageSize`) with
`Selection` and `GestureHandling` added. The wiki's
[Figures](https://github.com/enumeratio/notatio/wiki/Figures) page has the whole design.

A `Show` whose first layer is a plot or a `Graphics` draws its layers in one plot frame: `Plot`, `ParametricPlot`, `ListPlot`, `ListLinePlot` and `Graphics`, in order. The window and the frame's options are the first plot's unless the `Show` gives its own (`PlotRange`, `Axes`, `Frame`, `AxesLabel`, `FrameLabel`, `GridLines`, `PlotLabel`). A `Graphics` before the first plot is drawn under the curves and one after it over them, and each layer keeps its own `PlotStyle`. Zooming samples every plot again over the shared window. Such a `Show` does not also hold tiles or diagrams.
