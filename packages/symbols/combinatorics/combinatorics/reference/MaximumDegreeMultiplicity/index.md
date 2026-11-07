---
name: MaximumDegreeMultiplicity
domain: Graph statistics
signature: MaximumDegreeMultiplicity(graph)
summary: The most vertices that share one degree.
signatures:
  - call: MaximumDegreeMultiplicity(graph)
    description: The most vertices that share one degree.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001366
    url: https://www.findstat.org/St001366
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001366. The graph with no vertices gives 0.
