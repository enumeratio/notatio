---
name: DistanceThreePairCount
domain: Graph statistics
signature: DistanceThreePairCount(graph)
summary: The pairs of vertices at distance 3.
signatures:
  - call: DistanceThreePairCount(graph)
    description: The pairs of vertices at distance 3.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000447
    url: https://www.findstat.org/St000447
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000447. The graph with no vertices gives 0.
