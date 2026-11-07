---
name: AnnihilationNumber
domain: Graph statistics
signature: AnnihilationNumber(graph)
summary: The most vertices whose degrees add up to at most the number of edges.
catalog:
  - system: findstat
    identity: St001286
    url: https://www.findstat.org/St001286
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: AnnihilationNumber(graph)
    description: The most vertices whose degrees add up to at most the number of edges.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001286: the largest k with the k smallest degrees adding up to at most the edges; the best set of k vertices is those. The graph with no vertices gives 0.
