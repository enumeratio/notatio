---
name: OddAutomorphismCount
domain: Graph statistics
signature: OddAutomorphismCount(graph)
summary: The automorphisms with an odd number of edges whose ends swap order.
catalog:
  - system: findstat
    identity: St001783
    url: https://www.findstat.org/St001783
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: OddAutomorphismCount(graph)
    description: The automorphisms with an odd number of edges whose ends swap order.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001783: the automorphisms p for which the number of edges (u, v), u < v, with p(u) > p(v) is odd. The graph with no vertices gives 0, a convention and not a FindStat row.
