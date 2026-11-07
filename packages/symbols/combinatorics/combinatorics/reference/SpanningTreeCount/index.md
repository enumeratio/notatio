---
name: SpanningTreeCount
domain: Graph statistics
signature: SpanningTreeCount(graph)
summary: "The spanning trees: by the matrix-tree theorem, the determinant of the Laplacian with its last row and column deleted."
signatures:
  - call: SpanningTreeCount(graph)
    description: "The spanning trees: by the matrix-tree theorem, the determinant of the Laplacian with its last row and column deleted."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000096
    url: https://www.findstat.org/St000096
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000096. A graph with two components has none. The graph with no vertices gives 0.
