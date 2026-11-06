---
name: DegreeTwoVertexCount
domain: Graph statistics
signature: DegreeTwoVertexCount(graph)
summary: The vertices with exactly two edges.
signatures:
  - call: DegreeTwoVertexCount(graph)
    description: The vertices with exactly two edges.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000313
    url: https://www.findstat.org/St000313
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000313. The graph with no vertices gives 0.
