---
name: IndependentDominationNumber
domain: Graph statistics
signature: IndependentDominationNumber(graph)
summary: "The fewest vertices in a set that is independent and dominating: a maximal independent set."
signatures:
  - call: IndependentDominationNumber(graph)
    description: "The fewest vertices in a set that is independent and dominating: a maximal independent set."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001322. The graph with no vertices gives 0.
