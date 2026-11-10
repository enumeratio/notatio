---
name: NowhereZeroFourFlowCount
domain: Graph statistics
signature: NowhereZeroFourFlowCount(graph)
summary: "The nowhere-zero flows with values in the integers modulo 4: the absolute value of the Tutte polynomial at x = 0, y = -3."
catalog:
  - system: findstat
    identity: St001478
    url: https://www.findstat.org/St001478
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: NowhereZeroFourFlowCount(graph)
    description: "The nowhere-zero flows with values in the integers modulo 4: the absolute value of the Tutte polynomial at x = 0, y = -3."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001478, the flow polynomial at 4: (-1)^nullity times that evaluation, which is never negative. The graph with no vertices has one flow, the empty one, so 1.
