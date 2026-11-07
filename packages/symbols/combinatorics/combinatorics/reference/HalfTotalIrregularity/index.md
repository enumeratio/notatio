---
name: HalfTotalIrregularity
domain: Graph statistics
signature: HalfTotalIrregularity(graph)
summary: Half the sum over the unordered pairs of vertices of the difference of their degrees.
catalog:
  - system: findstat
    identity: St001521
    url: https://www.findstat.org/St001521
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: HalfTotalIrregularity(graph)
    description: Half the sum over the unordered pairs of vertices of the difference of their degrees.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001521. Four times it is the sum over the ordered pairs. The graph with no vertices gives 0.
