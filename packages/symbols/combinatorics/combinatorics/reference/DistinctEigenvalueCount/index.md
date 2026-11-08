---
name: DistinctEigenvalueCount
domain: Graph statistics
signature: DistinctEigenvalueCount(graph)
summary: The distinct eigenvalues of the adjacency matrix.
signatures:
  - call: DistinctEigenvalueCount(graph)
    description: The distinct eigenvalues of the adjacency matrix.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000452
    url: https://www.findstat.org/St000452
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000452. The characteristic polynomial has as many distinct roots as its degree less that of its greatest common divisor with its derivative. The graph with no vertices gives 0.
