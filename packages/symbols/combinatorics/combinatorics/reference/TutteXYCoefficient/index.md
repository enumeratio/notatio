---
name: TutteXYCoefficient
domain: Graph statistics
signature: TutteXYCoefficient(graph)
summary: The coefficient of x y in the Tutte polynomial.
catalog:
  - system: findstat
    identity: St001069
    url: https://www.findstat.org/St001069
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001069: the sum over the sets of edges A of the coefficient of x in (x - 1)^corank(A) times that of y in (y - 1)^nullity(A). The graph with no vertices gives 0.
