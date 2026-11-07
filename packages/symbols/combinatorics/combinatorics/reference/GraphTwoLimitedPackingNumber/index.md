---
name: GraphTwoLimitedPackingNumber
domain: Graph statistics
signature: GraphTwoLimitedPackingNumber(graph)
summary: The most vertices in a set that has at most two members among the closed neighborhood of any vertex.
catalog:
  - system: findstat
    identity: St000918
    url: https://www.findstat.org/St000918
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: GraphTwoLimitedPackingNumber(graph)
    description: The most vertices in a set that has at most two members among the closed neighborhood of any vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000918. The graph with no vertices gives 0.
