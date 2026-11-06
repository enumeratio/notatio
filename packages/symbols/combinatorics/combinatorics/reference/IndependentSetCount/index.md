---
name: IndependentSetCount
domain: Graph statistics
signature: IndependentSetCount(graph)
summary: The sets of vertices, the empty set included, with no two adjacent.
signatures:
  - call: IndependentSetCount(graph)
    description: The sets of vertices, the empty set included, with no two adjacent.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000300. The graph with no vertices has the empty set, so 1.
