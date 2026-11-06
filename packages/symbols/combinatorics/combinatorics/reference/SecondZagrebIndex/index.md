---
name: SecondZagrebIndex
domain: Graph statistics
signature: SecondZagrebIndex(graph)
summary: The sum over the edges of the product of the degrees of its ends.
signatures:
  - call: SecondZagrebIndex(graph)
    description: The sum over the edges of the product of the degrees of its ends.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000361
    url: https://www.findstat.org/St000361
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000361. The graph with no vertices gives 0.
