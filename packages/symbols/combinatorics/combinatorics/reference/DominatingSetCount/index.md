---
name: DominatingSetCount
domain: Graph statistics
signature: DominatingSetCount(graph)
summary: The sets of vertices such that every vertex is in the set or adjacent to one of it.
signatures:
  - call: DominatingSetCount(graph)
    description: The sets of vertices such that every vertex is in the set or adjacent to one of it.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001303
    url: https://www.findstat.org/St001303
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001303. The graph with no vertices has the empty set, so 1.
