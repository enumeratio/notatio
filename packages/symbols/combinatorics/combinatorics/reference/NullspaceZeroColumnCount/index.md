---
name: NullspaceZeroColumnCount
domain: Graph statistics
signature: NullspaceZeroColumnCount(graph)
summary: The vertices whose coordinate is zero in every vector of the adjacency matrix's nullspace.
catalog:
  - system: findstat
    identity: St001459
    url: https://www.findstat.org/St001459
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: NullspaceZeroColumnCount(graph)
    description: The vertices whose coordinate is zero in every vector of the adjacency matrix's nullspace.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001459. The adjacency matrix is symmetric, so a vertex's coordinate vanishes on the nullspace exactly when its unit row lies in the row space: appending it leaves the rank unchanged. The graph with no vertices gives 0.
