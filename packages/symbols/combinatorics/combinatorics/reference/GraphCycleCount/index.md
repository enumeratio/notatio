---
name: GraphCycleCount
domain: Graph statistics
signature: GraphCycleCount(graph)
summary: The cycles, each counted once however it is started or turned.
signatures:
  - call: GraphCycleCount(graph)
    description: The cycles, each counted once however it is started or turned.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001736
    url: https://www.findstat.org/St001736
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001736. The graph with no vertices gives 0.
