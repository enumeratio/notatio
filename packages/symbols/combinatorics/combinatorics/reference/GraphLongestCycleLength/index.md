---
name: GraphLongestCycleLength
domain: Graph statistics
signature: GraphLongestCycleLength(graph)
summary: The length of the longest cycle.
signatures:
  - call: GraphLongestCycleLength(graph)
    description: The length of the longest cycle.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000637
    url: https://www.findstat.org/St000637
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000637; a graph without a cycle gives 0. The graph with no vertices gives 0.
