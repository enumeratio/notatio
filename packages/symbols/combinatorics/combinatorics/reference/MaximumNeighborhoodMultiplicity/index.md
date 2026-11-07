---
name: MaximumNeighborhoodMultiplicity
domain: Graph statistics
signature: MaximumNeighborhoodMultiplicity(graph)
summary: The most vertices that have the same set of neighbors.
catalog:
  - system: findstat
    identity: St000723
    url: https://www.findstat.org/St000723
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MaximumNeighborhoodMultiplicity(graph)
    description: The most vertices that have the same set of neighbors.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000723. The graph with no vertices gives 0.
