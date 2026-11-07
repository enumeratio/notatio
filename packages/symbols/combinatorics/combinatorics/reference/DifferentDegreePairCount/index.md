---
name: DifferentDegreePairCount
domain: Graph statistics
signature: DifferentDegreePairCount(graph)
summary: The pairs of vertices whose degrees differ.
catalog:
  - system: findstat
    identity: St001708
    url: https://www.findstat.org/St001708
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: DifferentDegreePairCount(graph)
    description: The pairs of vertices whose degrees differ.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001708. The graph with no vertices gives 0.
