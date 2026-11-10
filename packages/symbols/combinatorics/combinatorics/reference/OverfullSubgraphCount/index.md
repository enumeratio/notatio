---
name: OverfullSubgraphCount
domain: Graph statistics
signature: OverfullSubgraphCount(graph)
summary: The sets of edges with more edges than the greatest degree times half the vertices they meet, rounded down.
catalog:
  - system: findstat
    identity: St001797
    url: https://www.findstat.org/St001797
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: OverfullSubgraphCount(graph)
    description: The sets of edges with more edges than the greatest degree times half the vertices they meet, rounded down.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001797: the empty set of edges is never overfull. The graph with no vertices gives 0.
