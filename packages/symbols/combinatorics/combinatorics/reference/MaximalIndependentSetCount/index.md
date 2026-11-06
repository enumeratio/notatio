---
name: MaximalIndependentSetCount
domain: Graph statistics
signature: MaximalIndependentSetCount(graph)
summary: The independent sets of vertices that no vertex can be added to.
signatures:
  - call: MaximalIndependentSetCount(graph)
    description: The independent sets of vertices that no vertex can be added to.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001304
    url: https://www.findstat.org/St001304
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001304. The graph with no vertices has the empty set, so 1.
