---
name: MinimumVertexCoverCount
domain: Graph statistics
signature: MinimumVertexCoverCount(graph)
summary: "The vertex covers with the fewest vertices: the independent sets with the most."
signatures:
  - call: MinimumVertexCoverCount(graph)
    description: "The vertex covers with the fewest vertices: the independent sets with the most."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000363: the covers of the least possible size, which are the complements of the largest independent sets. The graph with no vertices has the empty cover, so 1.
