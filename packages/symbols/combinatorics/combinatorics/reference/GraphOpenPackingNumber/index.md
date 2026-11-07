---
name: GraphOpenPackingNumber
domain: Graph statistics
signature: GraphOpenPackingNumber(graph)
summary: The most vertices with pairwise disjoint sets of neighbors.
catalog:
  - system: findstat
    identity: St000917
    url: https://www.findstat.org/St000917
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: GraphOpenPackingNumber(graph)
    description: The most vertices with pairwise disjoint sets of neighbors.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000917. A set is an open packing when every vertex has at most one member among its neighbors. The graph with no vertices gives 0.
