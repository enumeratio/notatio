---
name: Degeneracy
domain: Graph statistics
signature: Degeneracy(graph)
summary: The greatest, over the sets of vertices, of the least number of neighbors a vertex has inside the set.
signatures:
  - call: Degeneracy(graph)
    description: The greatest, over the sets of vertices, of the least number of neighbors a vertex has inside the set.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001277
    url: https://www.findstat.org/St001277
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001277. The graph with no vertices gives 0.
