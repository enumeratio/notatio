---
name: BetaInvariant
domain: Graph statistics
signature: BetaInvariant(graph)
summary: "Crapo's beta invariant: the absolute value of the sum over sets of edges of (-1)^size times their rank."
catalog:
  - system: findstat
    identity: St001071
    url: https://www.findstat.org/St001071
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: BetaInvariant(graph)
    description: "Crapo's beta invariant: the absolute value of the sum over sets of edges of (-1)^size times their rank."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001071, (-1)^rank times that sum, which is never negative. The graph with no vertices gives 0.
