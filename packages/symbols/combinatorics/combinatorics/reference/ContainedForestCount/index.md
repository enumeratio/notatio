---
name: ContainedForestCount
domain: Graph statistics
signature: ContainedForestCount(graph)
summary: The sets of edges, the empty set included, that contain no cycle.
catalog:
  - system: findstat
    identity: St000270
    url: https://www.findstat.org/St000270
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: ContainedForestCount(graph)
    description: The sets of edges, the empty set included, that contain no cycle.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000270, the Tutte polynomial at x = 2, y = 1. The graph with no vertices has one, so 1.
