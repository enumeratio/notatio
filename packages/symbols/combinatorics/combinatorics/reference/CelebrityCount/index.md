---
name: CelebrityCount
domain: Graph statistics
signature: CelebrityCount(graph)
summary: The vertices of whom more than half the neighbors have a smaller degree.
catalog:
  - system: findstat
    identity: St001689
    url: https://www.findstat.org/St001689
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: CelebrityCount(graph)
    description: The vertices of whom more than half the neighbors have a smaller degree.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001689. The graph with no vertices gives 0.
