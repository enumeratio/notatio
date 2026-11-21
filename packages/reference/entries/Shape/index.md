---
name: Shape
domain: Compute engine
signature: Shape(value) -> tuple
summary: Return the shape tuple of an expression.
signatures:
  - call: Shape(value) -> tuple
    description: as compute-engine declares it
  - call: Shape(value) -> tuple
    description: reads a nested list's own structure when its elements' type carries no dimensions, as Wolfram's Dimensions does
    library: enumeratio-analytic
    type: (value) -> tuple
    overrides: compute-engine
  - call: Shape(value) -> tuple
    description: Return the shape tuple of an expression.
    library: enumeratio-evaluation
    type: (value) -> tuple
    overrides: compute-engine
names:
  wolfram: Dimensions
stub: engine
mapOn:
  - PlanePartition
  - SemistandardTableau
  - SetPartition
  - StandardTableau
---
