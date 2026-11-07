---
name: MaximumCutSize
domain: Graph statistics
signature: MaximumCutSize(graph)
summary: The most edges between the two sides of a division of the vertices.
signatures:
  - call: MaximumCutSize(graph)
    description: The most edges between the two sides of a division of the vertices.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001869. The graph with no vertices gives 0.
