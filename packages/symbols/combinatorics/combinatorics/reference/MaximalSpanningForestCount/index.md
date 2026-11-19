---
name: MaximalSpanningForestCount
domain: Graph statistics
signature: MaximalSpanningForestCount(graph)
summary: "The spanning forests with as many edges as the graph's rank: the Tutte polynomial at x = 1, y = 1."
catalog:
  - system: findstat
    identity: St000267
    url: https://www.findstat.org/St000267
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MaximalSpanningForestCount(graph)
    description: "The spanning forests with as many edges as the graph's rank: the Tutte polynomial at x = 1, y = 1."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000267: one spanning tree for each connected component, chosen independently. The graph with no vertices has one, the empty forest, a convention and not a FindStat row: 1.
