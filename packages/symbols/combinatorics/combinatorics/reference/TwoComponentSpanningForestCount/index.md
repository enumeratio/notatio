---
name: TwoComponentSpanningForestCount
domain: Graph statistics
signature: TwoComponentSpanningForestCount(graph)
summary: The sets of edges that form a forest with two trees on all the vertices.
catalog:
  - system: findstat
    identity: St001827
    url: https://www.findstat.org/St001827
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: TwoComponentSpanningForestCount(graph)
    description: The sets of edges that form a forest with two trees on all the vertices.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001827: the sets of edges with no cycle (size = rank) and two components. The graph with no vertices gives 0.
