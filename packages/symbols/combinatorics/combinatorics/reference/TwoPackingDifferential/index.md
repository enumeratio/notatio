---
name: TwoPackingDifferential
domain: Graph statistics
signature: TwoPackingDifferential(graph)
summary: The most, over the sets of vertices with disjoint closed neighborhoods, of the vertices outside the set with a neighbor in it less the vertices in it.
signatures:
  - call: TwoPackingDifferential(graph)
    description: The most, over the sets of vertices with disjoint closed neighborhoods, of the vertices outside the set with a neighbor in it less the vertices in it.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001724
    url: https://www.findstat.org/St001724
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001724. Closed neighborhoods of two vertices meet when they are at most 2 apart. The empty set gives 0. The graph with no vertices gives 0.
