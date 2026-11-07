---
name: DegreeSum
domain: Graph statistics
signature: DegreeSum(graph)
summary: "The sum of the degrees: twice the number of edges."
catalog:
  - system: findstat
    identity: St000350
    url: https://www.findstat.org/St000350
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: DegreeSum(graph)
    description: "The sum of the degrees: twice the number of edges."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000350. The graph with no vertices gives 0.
