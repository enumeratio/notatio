---
name: HalfAlbertsonIndex
domain: Graph statistics
signature: HalfAlbertsonIndex(graph)
summary: Half the sum over the edges of the difference of the degrees of its ends.
catalog:
  - system: findstat
    identity: St001350
    url: https://www.findstat.org/St001350
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: HalfAlbertsonIndex(graph)
    description: Half the sum over the edges of the difference of the degrees of its ends.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001350. The sum is always even. The graph with no vertices gives 0.
