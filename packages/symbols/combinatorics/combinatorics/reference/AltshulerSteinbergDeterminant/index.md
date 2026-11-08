---
name: AltshulerSteinbergDeterminant
domain: Graph statistics
signature: AltshulerSteinbergDeterminant(graph)
summary: The determinant of the signless Laplacian, the incidence matrix times its transpose.
signatures:
  - call: AltshulerSteinbergDeterminant(graph)
    description: The determinant of the signless Laplacian, the incidence matrix times its transpose.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000368
    url: https://www.findstat.org/St000368
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000368: the constant coefficient of the characteristic polynomial, up to the sign (-1)^n. The graph with no vertices has the empty determinant, 1.
