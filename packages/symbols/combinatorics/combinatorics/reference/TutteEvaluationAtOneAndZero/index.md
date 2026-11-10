---
name: TutteEvaluationAtOneAndZero
domain: Graph statistics
signature: TutteEvaluationAtOneAndZero(graph)
summary: The Tutte polynomial at x = 1, y = 0.
catalog:
  - system: findstat
    identity: St001475
    url: https://www.findstat.org/St001475
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: TutteEvaluationAtOneAndZero(graph)
    description: The Tutte polynomial at x = 1, y = 0.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001475. The graph with no vertices gives 1.
