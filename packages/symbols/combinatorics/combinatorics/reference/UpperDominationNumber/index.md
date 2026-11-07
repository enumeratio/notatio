---
name: UpperDominationNumber
domain: Graph statistics
signature: UpperDominationNumber(graph)
summary: The most vertices in a minimal dominating set.
signatures:
  - call: UpperDominationNumber(graph)
    description: The most vertices in a minimal dominating set.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001337. The graph with no vertices gives 0.
