---
name: KingCount
domain: Graph statistics
signature: KingCount(graph)
summary: The vertices whose neighbors all have a smaller degree; an isolated vertex counts.
catalog:
  - system: findstat
    identity: St001691
    url: https://www.findstat.org/St001691
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: KingCount(graph)
    description: The vertices whose neighbors all have a smaller degree; an isolated vertex counts.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001691. The graph with no vertices gives 0.
