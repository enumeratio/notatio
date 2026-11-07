---
name: AboveAverageDegreeVertexCount
domain: Graph statistics
signature: AboveAverageDegreeVertexCount(graph)
summary: The vertices whose degree is greater than the average degree.
catalog:
  - system: findstat
    identity: St001692
    url: https://www.findstat.org/St001692
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: AboveAverageDegreeVertexCount(graph)
    description: The vertices whose degree is greater than the average degree.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001692. The graph with no vertices gives 0.
