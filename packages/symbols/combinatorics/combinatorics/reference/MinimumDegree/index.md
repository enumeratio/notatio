---
name: MinimumDegree
domain: Graph statistics
signature: MinimumDegree(graph)
summary: The fewest edges at one vertex.
signatures:
  - call: MinimumDegree(graph)
    description: The fewest edges at one vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000310
    url: https://www.findstat.org/St000310
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000310. The graph with no vertices gives 0.
