---
name: TutteEvaluationAtTwoAndMinusOne
domain: Graph statistics
signature: TutteEvaluationAtTwoAndMinusOne(graph)
summary: The Tutte polynomial at x = 2, y = -1.
catalog:
  - system: findstat
    identity: St001474
    url: https://www.findstat.org/St001474
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001474. The graph with no vertices gives 1.
