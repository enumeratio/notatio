---
name: FirstZagrebIndex
domain: Graph statistics
signature: FirstZagrebIndex(graph)
summary: The sum of the squares of the degrees.
signatures:
  - call: FirstZagrebIndex(graph)
    description: The sum of the squares of the degrees.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000465
    url: https://www.findstat.org/St000465
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000465. The graph with no vertices gives 0.
