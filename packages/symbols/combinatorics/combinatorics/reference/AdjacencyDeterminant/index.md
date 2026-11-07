---
name: AdjacencyDeterminant
domain: Graph statistics
signature: AdjacencyDeterminant(graph)
summary: The determinant of the adjacency matrix.
signatures:
  - call: AdjacencyDeterminant(graph)
    description: The determinant of the adjacency matrix.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000351
    url: https://www.findstat.org/St000351
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000351. The graph with no vertices has the empty determinant, 1.
