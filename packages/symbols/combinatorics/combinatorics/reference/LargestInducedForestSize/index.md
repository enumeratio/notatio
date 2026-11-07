---
name: LargestInducedForestSize
domain: Graph statistics
signature: LargestInducedForestSize(graph)
summary: The most vertices that induce a graph with no cycle.
catalog:
  - system: findstat
    identity: St001321
    url: https://www.findstat.org/St001321
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: LargestInducedForestSize(graph)
    description: The most vertices that induce a graph with no cycle.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001321. The graph with no vertices gives 0.
