---
name: VertexCoverNumber
domain: Graph statistics
signature: VertexCoverNumber(graph)
summary: "The fewest vertices that meet every edge: the vertices less the independence number."
signatures:
  - call: VertexCoverNumber(graph)
    description: "The fewest vertices that meet every edge: the vertices less the independence number."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000362. The graph with no vertices gives 0.
