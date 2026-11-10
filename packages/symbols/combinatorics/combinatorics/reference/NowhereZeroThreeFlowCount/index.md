---
name: NowhereZeroThreeFlowCount
domain: Graph statistics
signature: NowhereZeroThreeFlowCount(graph)
summary: "The nowhere-zero flows with values in the integers modulo 3: the absolute value of the Tutte polynomial at x = 0, y = -2."
catalog:
  - system: findstat
    identity: St001073
    url: https://www.findstat.org/St001073
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001073. The graph with no vertices has one flow, the empty one, so 1.
