---
name: NullspaceDistinctColumnCount
domain: Graph statistics
signature: NullspaceDistinctColumnCount(graph)
summary: "The vertices' distinct coordinate functions on the adjacency matrix's nullspace: vertices are alike when every nullspace vector agrees on them."
catalog:
  - system: findstat
    identity: St001463
    url: https://www.findstat.org/St001463
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: NullspaceDistinctColumnCount(graph)
    description: "The vertices' distinct coordinate functions on the adjacency matrix's nullspace: vertices are alike when every nullspace vector agrees on them."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001463. Vertices u and v agree on every nullspace vector exactly when the unit row of u less that of v lies in the row space, so a vertex starts a new column when no earlier vertex is alike. The graph with no vertices gives 0.
