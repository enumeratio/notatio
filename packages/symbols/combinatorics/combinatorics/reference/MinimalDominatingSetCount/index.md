---
name: MinimalDominatingSetCount
domain: Graph statistics
signature: MinimalDominatingSetCount(graph)
summary: The dominating sets that stop dominating when any vertex is dropped.
signatures:
  - call: MinimalDominatingSetCount(graph)
    description: The dominating sets that stop dominating when any vertex is dropped.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001302
    url: https://www.findstat.org/St001302
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001302. The graph with no vertices has the empty set, so 1.
