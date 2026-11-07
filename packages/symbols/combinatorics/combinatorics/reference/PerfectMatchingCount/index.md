---
name: PerfectMatchingCount
domain: Graph statistics
signature: PerfectMatchingCount(graph)
summary: The sets of edges that meet every vertex exactly once.
signatures:
  - call: PerfectMatchingCount(graph)
    description: The sets of edges that meet every vertex exactly once.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000274. The graph with no vertices has the empty set, so 1.
