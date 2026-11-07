---
name: GraphPackingNumber
domain: Graph statistics
signature: GraphPackingNumber(graph)
summary: "The most vertices, no two within distance 2: the closed neighborhoods of the vertices are disjoint."
catalog:
  - system: findstat
    identity: St000916
    url: https://www.findstat.org/St000916
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: GraphPackingNumber(graph)
    description: "The most vertices, no two within distance 2: the closed neighborhoods of the vertices are disjoint."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000916. A set is a packing when every vertex has at most one member among itself and its neighbors. The graph with no vertices gives 0.
