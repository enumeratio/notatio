---
name: GraphLeafCount
domain: Graph statistics
signature: GraphLeafCount(graph)
summary: The vertices with exactly one edge.
signatures:
  - call: GraphLeafCount(graph)
    description: The vertices with exactly one edge.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000312. The graph with no vertices gives 0.
