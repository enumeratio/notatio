---
name: TutteEvaluationAtThreeAndThree
domain: Graph statistics
signature: TutteEvaluationAtThreeAndThree(graph)
summary: The Tutte polynomial at x = 3, y = 3.
catalog:
  - system: findstat
    identity: St001072
    url: https://www.findstat.org/St001072
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001072. The graph with no vertices gives 1.
