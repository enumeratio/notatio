---
name: UpperIrredundanceNumber
domain: Graph statistics
signature: UpperIrredundanceNumber(graph)
summary: The most vertices in a maximal irredundant set.
signatures:
  - call: UpperIrredundanceNumber(graph)
    description: The most vertices in a maximal irredundant set.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001338
    url: https://www.findstat.org/St001338
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001338. A set is irredundant when each of its vertices has a vertex in its closed neighborhood that the closed neighborhoods of the others miss. The graph with no vertices gives 0.
