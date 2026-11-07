---
name: InducedPathOnFourVerticesCount
domain: Graph statistics
signature: InducedPathOnFourVerticesCount(graph)
summary: "The sets of four vertices that induce a path: three edges, and every vertex has one or two neighbors among the four."
catalog:
  - system: findstat
    identity: St001306
    url: https://www.findstat.org/St001306
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: InducedPathOnFourVerticesCount(graph)
    description: "The sets of four vertices that induce a path: three edges, and every vertex has one or two neighbors among the four."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001306. The graph with no vertices gives 0.
