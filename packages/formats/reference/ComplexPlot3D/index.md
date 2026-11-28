---
name: ComplexPlot3D
domain: Graphics
signature: ComplexPlot3D(...)
summary: The modulus of a complex function as a surface, colored by phase.
names:
  wolframIdentity: true
options:
  - ColorFunction
signatures:
  - call: ComplexPlot3D(...)
    description: The modulus of a complex function as a surface, colored by phase.
    library: enumeratio-formats
    type: (any*) -> any
---

`ComplexPlot3D(f, (z, zmin, zmax))` raises the surface to `|f|` over the rectangle and colors each face by the argument of `f`; a pole rises to a fixed height rather than tearing a hole.
