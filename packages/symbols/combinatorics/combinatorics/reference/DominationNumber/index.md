---
name: DominationNumber
domain: Graph statistics
signature: DominationNumber(graph)
summary: The fewest vertices such that every vertex is one of them or adjacent to one.
signatures:
  - call: DominationNumber(graph)
    description: The fewest vertices such that every vertex is one of them or adjacent to one.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000273
    url: https://www.findstat.org/St000273
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000273. The graph with no vertices gives 0.
