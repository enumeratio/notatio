---
name: SameNeighborhoodPairCount
domain: Graph statistics
signature: SameNeighborhoodPairCount(graph)
summary: The pairs of vertices that have the same set of neighbors.
catalog:
  - system: findstat
    identity: St001347
    url: https://www.findstat.org/St001347
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: SameNeighborhoodPairCount(graph)
    description: The pairs of vertices that have the same set of neighbors.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001347. The graph with no vertices gives 0.
