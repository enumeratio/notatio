---
name: GraphComponentCount
domain: Graph statistics
signature: GraphComponentCount(graph)
summary: "The connected components: the vertices that are the first of their component."
signatures:
  - call: GraphComponentCount(graph)
    description: "The connected components: the vertices that are the first of their component."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000287. The graph with no vertices gives 0.
