---
name: AbsoluteAdjacencyDeterminant
domain: Graph statistics
signature: AbsoluteAdjacencyDeterminant(graph)
summary: The absolute value of the determinant of the adjacency matrix.
catalog:
  - system: findstat
    identity: St001702
    url: https://www.findstat.org/St001702
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: AbsoluteAdjacencyDeterminant(graph)
    description: The absolute value of the determinant of the adjacency matrix.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001702. The graph with no vertices has the empty determinant, 1.
