---
name: ForgottenIndex
domain: Graph statistics
signature: ForgottenIndex(graph)
summary: The sum of the cubes of the degrees.
signatures:
  - call: ForgottenIndex(graph)
    description: The sum of the cubes of the degrees.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000571
    url: https://www.findstat.org/St000571
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000571, the F-index. The graph with no vertices gives 0.
