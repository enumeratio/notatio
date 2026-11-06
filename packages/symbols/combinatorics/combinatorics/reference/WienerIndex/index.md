---
name: WienerIndex
domain: Graph statistics
signature: WienerIndex(graph)
summary: The sum of the distances over the pairs of vertices that are joined by a path.
signatures:
  - call: WienerIndex(graph)
    description: The sum of the distances over the pairs of vertices that are joined by a path.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000265
    url: https://www.findstat.org/St000265
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000265, the Wiener index; a pair with no path adds nothing. The graph with no vertices gives 0.
