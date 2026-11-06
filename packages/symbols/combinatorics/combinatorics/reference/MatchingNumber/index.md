---
name: MatchingNumber
domain: Graph statistics
signature: MatchingNumber(graph)
summary: The most edges with no two sharing a vertex.
signatures:
  - call: MatchingNumber(graph)
    description: The most edges with no two sharing a vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000387. The graph with no vertices gives 0.
