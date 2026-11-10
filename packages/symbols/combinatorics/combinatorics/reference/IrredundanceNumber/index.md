---
name: IrredundanceNumber
domain: Graph statistics
signature: IrredundanceNumber(graph)
summary: The fewest vertices in a maximal irredundant set.
signatures:
  - call: IrredundanceNumber(graph)
    description: The fewest vertices in a maximal irredundant set.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001339
    url: https://www.findstat.org/St001339
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001339. A subset of an irredundant set is irredundant, so a set is maximal when no one vertex can be added. The graph with no vertices gives 0.
