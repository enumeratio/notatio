---
name: ComplexPlot
domain: Graphics
signature: ComplexPlot(...)
summary: A complex function of a complex variable, colored by phase.
names:
  wolframIdentity: true
options:
  - ColorFunction
signatures:
  - call: ComplexPlot(...)
    description: A complex function of a complex variable, colored by phase.
    library: enumeratio-formats
    type: (any*) -> any
---

`ComplexPlot(f, (z, zmin, zmax))` colors each point of the rectangle by the argument of `f` and its brightness by the modulus, so zeros are black and poles white.
